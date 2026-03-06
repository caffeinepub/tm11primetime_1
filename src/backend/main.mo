import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type User = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    referralCode : Text;
    referredBy : Text;
    walletBalance : Nat;
    isActive : Bool;
    isPaid : Bool;
    joinedAt : Int;
    role : Text;
  };

  type Video = {
    id : Nat;
    title : Text;
    category : Text;
    url : Text;
    description : Text;
    duration : Nat;
    createdAt : Int;
  };

  type WatchRecord = {
    userId : Nat;
    videoId : Nat;
    watchedSeconds : Nat;
    completed : Bool;
    subscribed : Bool;
  };

  type Transaction = {
    id : Nat;
    userId : Nat;
    amount : Int;
    txType : Text;
    note : Text;
    timestamp : Int;
  };

  type ReferralNode = {
    id : Nat;
    name : Text;
    referralCode : Text;
    children : [ReferralNode];
  };

  public type UserProfile = {
    userId : Nat;
    name : Text;
    email : Text;
    phone : Text;
  };

  var nextUserId = 1;
  var nextVideoId = 1;
  var nextTransactionId = 1;

  let users = Map.empty<Nat, User>();
  let videos = Map.empty<Nat, Video>();
  let watchRecords = Map.empty<Nat, WatchRecord>();
  let transactions = Map.empty<Nat, Transaction>();
  let principalToUserId = Map.empty<Principal, Nat>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  module Transaction {
    public func compare(a : Transaction, b : Transaction) : Order.Order {
      Nat.compare(a.userId, b.userId);
    };
  };

  func generateReferralCode(userId : Nat) : Text {
    "REF" # userId.toText();
  };

  func findReferrals(referralCode : Text) : [Nat] {
    users.values().toArray().filter(
      func(u) {
        Text.equal(u.referredBy, referralCode);
      }
    ).map(func(u) { u.id });
  };

  func buildReferralTree(userId : Nat, level : Nat) : ReferralNode {
    let user = switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    let childrenIds = findReferrals(user.referralCode);
    let childrenNodes = childrenIds.map(func(id) { buildReferralTree(id, level + 1) });

    {
      id = user.id;
      name = user.name;
      referralCode = user.referralCode;
      children = if (level < 4) { childrenNodes } else { [] };
    };
  };

  func getUserIdFromPrincipal(caller : Principal) : ?Nat {
    principalToUserId.get(caller);
  };

  public shared ({ caller }) func register(name : Text, email : Text, phone : Text, referredBy : Text) : async Text {
    let userId = nextUserId;
    nextUserId += 1;

    let referralCode = generateReferralCode(userId);

    let newUser : User = {
      id = userId;
      name;
      email;
      phone;
      referralCode;
      referredBy;
      walletBalance = 0;
      isActive = true;
      isPaid = false;
      joinedAt = Time.now();
      role = "user";
    };

    users.add(userId, newUser);
    principalToUserId.add(caller, userId);
    
    let profile : UserProfile = {
      userId;
      name;
      email;
      phone;
    };
    userProfiles.add(caller, profile);

    referralCode;
  };

  public shared ({ caller }) func completePayment(userId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete payment");
    };

    let callerUserId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    if (callerUserId != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only complete payment for your own account");
    };

    let user = switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    if (user.isPaid) {
      Runtime.trap("User already paid");
    };

    let updatedUser = { user with isPaid = true; walletBalance = user.walletBalance + 15000 };
    users.add(userId, updatedUser);

    let bonusTxn : Transaction = {
      id = nextTransactionId;
      userId;
      amount = 15000;
      txType = "joining_bonus";
      note = "Joining bonus";
      timestamp = Time.now();
    };
    transactions.add(nextTransactionId, bonusTxn);
    nextTransactionId += 1;

    var currentReferralCode = user.referredBy;
    var level = 1;
    let levelEarnings = [1000, 500, 400, 300, 200, 100, 50, 25, 25, 25, 25, 25, 25, 25, 25];

    while (level <= 15 and not Text.equal(currentReferralCode, "")) {
      let referrerOpt = users.values().toArray().find(func(u) { Text.equal(u.referralCode, currentReferralCode) });
      
      switch (referrerOpt) {
        case (null) { level := 16 };
        case (?referrer) {
          let referralCount = findReferrals(referrer.referralCode).size();
          
          if (referrer.isPaid and referralCount >= 3) {
            let earning = levelEarnings[level - 1];
            let updatedReferrer = { referrer with walletBalance = referrer.walletBalance + earning };
            users.add(referrer.id, updatedReferrer);

            let earnTxn : Transaction = {
              id = nextTransactionId;
              userId = referrer.id;
              amount = earning;
              txType = "level_earning";
              note = "Level " # level.toText() # " earning from user " # userId.toText();
              timestamp = Time.now();
            };
            transactions.add(nextTransactionId, earnTxn);
            nextTransactionId += 1;
          };

          currentReferralCode := referrer.referredBy;
          level += 1;
        };
      };
    };
  };

  public query ({ caller }) func getMyProfile(userId : Nat) : async User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    let callerUserId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    if (callerUserId != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user };
    };
  };

  public query ({ caller }) func getReferralTree(userId : Nat) : async ReferralNode {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view referral tree");
    };

    let callerUserId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    if (callerUserId != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own referral tree");
    };

    buildReferralTree(userId, 0);
  };

  public query ({ caller }) func getAllVideos() : async [Video] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view videos");
    };

    let callerUserId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    let user = switch (users.get(callerUserId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    if (not user.isPaid and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only paid members can view videos");
    };

    videos.values().toArray();
  };

  public query ({ caller }) func getVideosByCategory(category : Text) : async [Video] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view videos");
    };

    let callerUserId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    let user = switch (users.get(callerUserId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    if (not user.isPaid and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only paid members can view videos");
    };

    videos.values().toArray().filter(func(v) { Text.equal(v.category, category) });
  };

  public shared ({ caller }) func recordWatchProgress(userId : Nat, videoId : Nat, watchedSeconds : Nat, subscribed : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record watch progress");
    };

    let callerUserId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    if (callerUserId != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only record your own watch progress");
    };

    let record : WatchRecord = {
      userId;
      videoId;
      watchedSeconds;
      completed = watchedSeconds >= 60;
      subscribed;
    };
    let watchRecordId = userId * 100000 + videoId;
    watchRecords.add(watchRecordId, record);
  };

  public query ({ caller }) func getMyWatchHistory(userId : Nat) : async [WatchRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view watch history");
    };

    let callerUserId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    if (callerUserId != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own watch history");
    };

    watchRecords.values().toArray().filter(func(w) { w.userId == userId });
  };

  public query ({ caller }) func getTransactions(userId : Nat) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    let callerUserId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    if (callerUserId != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own transactions");
    };

    transactions.values().toArray().filter(func(t) { t.userId == userId }).sort();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getAllUsers() : async [User] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    users.values().toArray();
  };

  public shared ({ caller }) func updateUserStatus(userId : Nat, isActive : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let user = switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    let updatedUser = { user with isActive };
    users.add(userId, updatedUser);
  };

  public shared ({ caller }) func addVideo(title : Text, category : Text, url : Text, description : Text, duration : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let videoId = nextVideoId;
    nextVideoId += 1;

    let video : Video = {
      id = videoId;
      title;
      category;
      url;
      description;
      duration;
      createdAt = Time.now();
    };

    videos.add(videoId, video);
  };

  public shared ({ caller }) func deleteVideo(videoId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    if (not videos.containsKey(videoId)) {
      Runtime.trap("Video not found");
    };

    videos.remove(videoId);
  };
};
