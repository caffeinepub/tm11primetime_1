import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Char "mo:core/Char";


import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Apply migration on upgrade

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

  type PaymentSubmission = {
    id : Nat;
    userId : Nat;
    name : Text;
    phone : Text;
    utr : Text;
    amount : Text;
    timestamp : Int;
    status : PaymentStatus;
  };

  type PaymentStatus = {
    #pending;
    #approved;
    #rejected;
  };

  public type PaymentSubmissionInput = {
    name : Text;
    phone : Text;
    utr : Text;
    amount : Text;
  };

  var nextUserId = 1;
  var nextVideoId = 1;
  var nextTransactionId = 1;
  var nextPaymentSubmissionId = 1;
  var adminAssigned = false;

  let users = Map.empty<Nat, User>();
  let videos = Map.empty<Nat, Video>();
  let watchRecords = Map.empty<Nat, WatchRecord>();
  let transactions = Map.empty<Nat, Transaction>();
  let principalToUserId = Map.empty<Principal, Nat>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let paymentSubmissions = Map.empty<Nat, PaymentSubmission>();

  module Transaction {
    public func compare(a : Transaction, b : Transaction) : Order.Order {
      Nat.compare(a.userId, b.userId);
    };
  };

  module PaymentSubmission {
    public func compare(a : PaymentSubmission, b : PaymentSubmission) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  // Helper function to normalize phone numbers (remove spaces, dashes, parentheses)
  func normalizePhone(phone : Text) : Text {
    let chars = phone.chars();
    var result = "";
    for (c in chars) {
      if (c != ' ' and c != '-' and c != '(' and c != ')') {
        result #= c.toText();
      };
    };
    result;
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
      children = if (level < 15) { childrenNodes } else { [] };
    };
  };

  func getUserIdFromPrincipal(caller : Principal) : ?Nat {
    principalToUserId.get(caller);
  };

  // New function: Get referral tree by code (no authentication required as specified)
  public query func getReferralTreeByCode(referralCode : Text) : async {
    id : Nat;
    name : Text;
    referralCode : Text;
    children : [ReferralNode];
  } {
    let user = users.values().toArray().find(
      func(u) {
        Text.equal(u.referralCode, referralCode);
      }
    );

    switch (user) {
      case (null) {
        {
          id = 0;
          name = "";
          referralCode;
          children = [];
        };
      };
      case (?u) {
        buildReferralTree(u.id, 0);
      };
    };
  };

  // USER-ONLY function - requires authentication to protect PII
  public query ({ caller }) func getUserByPhone(phone : Text) : async ?User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can lookup users by phone");
    };

    let normalizedSearch = normalizePhone(phone);
    users.values().toArray().find(
      func(u) {
        Text.equal(normalizePhone(u.phone), normalizedSearch);
      }
    );
  };

  // PUBLIC function - allows ALL callers (including anonymous) as specified
  public shared ({ caller }) func register(name : Text, email : Text, phone : Text, referredBy : Text) : async Text {
    // Check if phone number already exists
    let normalizedPhone = normalizePhone(phone);
    switch (users.values().toArray().find(func(u) { Text.equal(normalizePhone(u.phone), normalizedPhone) })) {
      case (?_) { Runtime.trap("Phone number already registered") };
      case (null) {};
    };

    // If caller is not anonymous, check principalToUserId as before
    if (not caller.isAnonymous()) {
      if (getUserIdFromPrincipal(caller) != null) {
        Runtime.trap("User already registered");
      };
    };

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

    // Only map principal to userId if caller is not anonymous
    if (not caller.isAnonymous()) {
      principalToUserId.add(caller, userId);
      let profile : UserProfile = {
        userId;
        name;
        email;
        phone;
      };
      userProfiles.add(caller, profile);

      // Directly assign user role in access control system
      accessControlState.userRoles.add(caller, #user);
    };

    referralCode;
  };

  // PUBLIC function - no authentication required as specified
  public shared ({ caller }) func submitPaymentProof(input : PaymentSubmissionInput) : async Nat {
    let normalizedPhone = normalizePhone(input.phone);

    let userOpt = users.values().toArray().find(
      func(u) {
        Text.equal(normalizePhone(u.phone), normalizedPhone);
      }
    );

    switch (userOpt) {
      case (null) {
        let submission : PaymentSubmission = {
          id = nextPaymentSubmissionId;
          userId = 0;
          name = input.name;
          phone = input.phone;
          utr = input.utr;
          amount = input.amount;
          timestamp = Time.now();
          status = #pending;
        };

        paymentSubmissions.add(nextPaymentSubmissionId, submission);
        nextPaymentSubmissionId += 1;

        submission.id;
      };
      case (?user) {
        if (user.isPaid) {
          Runtime.trap("User has already paid");
        };

        let submission : PaymentSubmission = {
          id = nextPaymentSubmissionId;
          userId = user.id;
          name = input.name;
          phone = input.phone;
          utr = input.utr;
          amount = input.amount;
          timestamp = Time.now();
          status = #pending;
        };

        paymentSubmissions.add(nextPaymentSubmissionId, submission);
        nextPaymentSubmissionId += 1;

        submission.id;
      };
    };
  };

  // USER-ONLY function
  public query ({ caller }) func getMyPaymentSubmissions() : async [PaymentSubmission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payment submissions");
    };

    let userId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    paymentSubmissions.values().toArray().filter(
      func(s) {
        s.userId == userId;
      }
    ).sort();
  };

  // ADMIN-ONLY function
  public query ({ caller }) func getAllPaymentSubmissions() : async [PaymentSubmission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all payment submissions");
    };

    paymentSubmissions.values().toArray().sort();
  };

  // ADMIN-ONLY function
  public shared ({ caller }) func verifyPaymentSubmission(submissionId : Nat, action : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can verify payment submissions");
    };

    let submission = switch (paymentSubmissions.get(submissionId)) {
      case (null) { Runtime.trap("Payment submission not found") };
      case (?s) { s };
    };

    switch (action) {
      case ("approve") {
        let user = switch (users.get(submission.userId)) {
          case (null) { Runtime.trap("User not found") };
          case (?u) { u };
        };

        if (user.isPaid) {
          Runtime.trap("User already paid");
        };

        let updatedUser = { user with isPaid = true; walletBalance = user.walletBalance + 15000 };
        users.add(submission.userId, updatedUser);

        let updatedSubmission = { submission with status = #approved };
        paymentSubmissions.add(submissionId, updatedSubmission);

        let bonusTxn : Transaction = {
          id = nextTransactionId;
          userId = submission.userId;
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
                  note = "Level " # level.toText() # " earning from user " # submission.userId.toText();
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
      case ("reject") {
        let updatedSubmission = { submission with status = #rejected };
        paymentSubmissions.add(submissionId, updatedSubmission);
      };
      case (_) {
        Runtime.trap("Invalid action");
      };
    };
  };

  // USER-ONLY function - users can only view their own profile
  public query ({ caller }) func getMyProfile(userId : Nat) : async User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    let callerUserId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    // Users can only view their own profile, admins can view any
    if (callerUserId != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user };
    };
  };

  // USER-ONLY function - users can only view their own tree
  public query ({ caller }) func getReferralTree(userId : Nat) : async ReferralNode {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view referral tree");
    };

    let callerUserId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    // Users can only view their own tree, admins can view any
    if (callerUserId != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own referral tree");
    };

    buildReferralTree(userId, 0);
  };

  // USER-ONLY function - only paid members or admin
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

  // USER-ONLY function - only paid members or admin
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

  // USER-ONLY function - only paid members
  public shared ({ caller }) func recordWatchProgress(videoId : Nat, watchedSeconds : Nat, subscribed : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record watch progress");
    };

    let userId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    let user = switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    if (not user.isPaid) {
      Runtime.trap("Unauthorized: Only paid members can watch videos");
    };

    let video = switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?v) { v };
    };

    let record : WatchRecord = {
      userId;
      videoId;
      watchedSeconds;
      completed = watchedSeconds >= video.duration;
      subscribed;
    };
    let watchRecordId = userId * 100000 + videoId;
    watchRecords.add(watchRecordId, record);
  };

  // USER-ONLY function
  public query ({ caller }) func getMyWatchHistory() : async [WatchRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view watch history");
    };

    let userId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    watchRecords.values().toArray().filter(func(w) { w.userId == userId });
  };

  // USER-ONLY function
  public query ({ caller }) func getTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    let userId = switch (getUserIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Caller not registered") };
      case (?id) { id };
    };

    transactions.values().toArray().filter(func(t) { t.userId == userId }).sort();
  };

  // USER-ONLY function
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  // USER-ONLY function - can view own profile or admin can view any
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // USER-ONLY function
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ADMIN-ONLY function
  public query ({ caller }) func getAllUsers() : async [User] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    users.values().toArray();
  };

  // ADMIN-ONLY function
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

  // ADMIN-ONLY function
  public shared ({ caller }) func updateUser(userId : Nat, name : Text, email : Text, phone : Text, isActive : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let user = switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    let updatedUser = { user with name; email; phone; isActive };
    users.add(userId, updatedUser);
  };

  // ADMIN-ONLY function
  public shared ({ caller }) func deleteUser(userId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let user = switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    // Remove user from users map
    users.remove(userId);

    // Remove from principalToUserId map
    for ((principal, uid) in principalToUserId.entries()) {
      if (uid == userId) {
        principalToUserId.remove(principal);
      };
    };

    // Remove from userProfiles map
    for ((principal, profile) in userProfiles.entries()) {
      if (profile.userId == userId) {
        userProfiles.remove(principal);
      };
    };

    // Remove all payment submissions for this user
    for ((id, submission) in paymentSubmissions.entries()) {
      if (submission.userId == userId) {
        paymentSubmissions.remove(id);
      };
    };
  };

  // ADMIN-ONLY function
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

  // ADMIN-ONLY function
  public shared ({ caller }) func deleteVideo(videoId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    if (not videos.containsKey(videoId)) {
      Runtime.trap("Video not found");
    };

    videos.remove(videoId);
  };

  // PUBLIC function - allows first authenticated caller to claim admin
  public shared ({ caller }) func claimFirstAdmin() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be authenticated to claim admin");
    };
    if (adminAssigned) {
      Runtime.trap("An admin has already been assigned");
    };

    // Directly add admin role to accessControlState.userRoles bypassing assignRole
    accessControlState.userRoles.add(caller, #admin);
    adminAssigned := true;
    accessControlState.adminAssigned := true;
  };

  // PUBLIC query function - no authentication required
  public query func isAdminAssigned() : async Bool {
    adminAssigned;
  };

  // ADMIN-ONLY function - only existing admins can assign new admins
  public shared ({ caller }) func forceSetAdmin(principalText : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign admin roles");
    };

    let newAdmin = Principal.fromText(principalText);
    accessControlState.userRoles.add(newAdmin, #admin);
    adminAssigned := true;
    accessControlState.adminAssigned := true;
    "OK";
  };
};
