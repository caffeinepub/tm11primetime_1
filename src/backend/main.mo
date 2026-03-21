import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Char "mo:core/Char";
import List "mo:core/List";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let ADMIN_PASSWORD = "aakbn@1014";
  let adminToken = "aakbn@1014";

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
    channelUrl : Text;
    thumbnailUrl : Text;
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
    phone : Text;
    referredByName : Text;
    referredByCode : Text;
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

  type ReferralStatNode = {
    id : Nat;
    name : Text;
    phone : Text;
    referralCode : Text;
    isPaid : Bool;
    directReferrals : Nat;
    totalNetwork : Nat;
    children : [ReferralStatNode];
  };

  type UserChannel = {
    id : Nat;
    name : Text;
    description : Text;
    ownerPhone : Text;
    thumbnailUrl : Text;
    bannerUrl : Text;
    createdAt : Int;
  };

  type UserVideo = {
    id : Nat;
    channelId : Nat;
    title : Text;
    url : Text;
    description : Text;
    thumbnailUrl : Text;
    category : Text;
    ownerPhone : Text;
    status : Text;
    createdAt : Int;
  };

  type ChannelLink = {
    id : Nat;
    name : Text;
    url : Text;
    createdAt : Int;
  };

  // ─── Stable counters (persist across upgrades) ───────────────────────────
  stable var nextUserId = 1;
  stable var nextVideoId = 1;
  stable var nextTransactionId = 1;
  stable var nextPaymentSubmissionId = 1;
  stable var adminAssigned = false;
  stable var joiningBonus : Nat = 150;
  stable var nextChannelId = 1;
  stable var nextUserVideoId = 1;
  stable var nextChannelLinkId = 1;

  // ─── Stable storage arrays (persist across upgrades) ─────────────────────
  stable var usersStable : [User] = [];
  stable var videosStable : [Video] = [];
  stable var watchRecordsStable : [(Nat, WatchRecord)] = [];
  stable var transactionsStable : [Transaction] = [];
  stable var paymentSubmissionsStable : [PaymentSubmission] = [];
  stable var userChannelsStable : [UserChannel] = [];
  stable var userVideosStable : [UserVideo] = [];
  stable var channelLinksStable : [ChannelLink] = [];

  // ─── In-memory Maps (populated from stable arrays on upgrade) ────────────
  let users = Map.empty<Nat, User>();
  let videos = Map.empty<Nat, Video>();
  let watchRecords = Map.empty<Nat, WatchRecord>();
  let transactions = Map.empty<Nat, Transaction>();
  let principalToUserId = Map.empty<Principal, Nat>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let paymentSubmissions = Map.empty<Nat, PaymentSubmission>();
  let userChannels = Map.empty<Nat, UserChannel>();
  let userVideos = Map.empty<Nat, UserVideo>();
  let phoneToUserId = Map.empty<Text, Nat>();
  let channelLinks = Map.empty<Nat, ChannelLink>();

  // ─── Restore state from stable arrays on canister start/upgrade ──────────
  private func restoreState() {
    for (user in usersStable.vals()) {
      users.add(user.id, user);
      phoneToUserId.add(user.phone, user.id);
    };
    for (video in videosStable.vals()) {
      videos.add(video.id, video);
    };
    for ((key, record) in watchRecordsStable.vals()) {
      watchRecords.add(key, record);
    };
    for (tx in transactionsStable.vals()) {
      transactions.add(tx.id, tx);
    };
    for (sub in paymentSubmissionsStable.vals()) {
      paymentSubmissions.add(sub.id, sub);
    };
    for (ch in userChannelsStable.vals()) {
      userChannels.add(ch.id, ch);
    };
    for (uv in userVideosStable.vals()) {
      userVideos.add(uv.id, uv);
    };
    for (cl in channelLinksStable.vals()) {
      channelLinks.add(cl.id, cl);
    };
  };

  // Run restore on canister init/upgrade
  restoreState();

  // ─── Upgrade hooks ────────────────────────────────────────────────────────
  system func preupgrade() {
    usersStable := users.values().toArray();
    videosStable := videos.values().toArray();
    watchRecordsStable := watchRecords.entries().toArray();
    transactionsStable := transactions.values().toArray();
    paymentSubmissionsStable := paymentSubmissions.values().toArray();
    userChannelsStable := userChannels.values().toArray();
    userVideosStable := userVideos.values().toArray();
    channelLinksStable := channelLinks.values().toArray();
  };

  system func postupgrade() {
    // Clear stable arrays to free heap memory after restore
    usersStable := [];
    videosStable := [];
    watchRecordsStable := [];
    transactionsStable := [];
    paymentSubmissionsStable := [];
    userChannelsStable := [];
    userVideosStable := [];
    channelLinksStable := [];
  };

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

  module UserChannel {
    public func compare(a : UserChannel, b : UserChannel) : Order.Order {
      Int.compare(a.createdAt, b.createdAt);
    };
  };

  func normalizePhone(phone : Text) : Text {
    let chars = phone.chars();
    var result = "";
    for (c in chars) {
      if (c != ' ' and c != '-' and c != '(' and c != ')') {
        result #= c.toText();
      };
    };

    // Strip leading +91 or 91
    if (result.startsWith(#text "+91")) {
      result := result.trimStart(#text "+91");
    } else if (result.startsWith(#text "91") and result.size() > 10) {
      result := result.trimStart(#text "91");
    };

    result;
  };

  func generateReferralCode(userId : Nat) : Text {
    "REV" # userId.toText();
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
      phone = user.phone;
      referredByName = findUserNameByReferralCode(user.referredBy);
      referredByCode = user.referredBy;
    };
  };

  func findUserNameByReferralCode(referralCode : Text) : Text {
    if (Text.equal(referralCode, "")) { return "" };
    switch (users.values().toArray().find(func(u) { Text.equal(u.referralCode, referralCode) })) {
      case (null) { "" };
      case (?user) { user.name };
    };
  };

  func verifyPassword(password : Text) : Bool {
    Text.equal(password, ADMIN_PASSWORD);
  };

  func countNetwork(referralCode : Text) : Nat {
    let directReferrals = findReferrals(referralCode);
    var total = directReferrals.size();

    for (userId in directReferrals.values()) {
      switch (users.get(userId)) {
        case (?user) {
          total += countNetwork(user.referralCode);
        };
        case (_) {};
      };
    };
    total;
  };

  // Phone-only ownership verification (no principal auth required)
  func findUserByPhoneInternal(phone : Text) : ?User {
    let normalizedPhone = normalizePhone(phone);
    switch (phoneToUserId.get(normalizedPhone)) {
      case (null) { null };
      case (?userId) { users.get(userId) };
    };
  };

  func distributeReferralEarnings(userId : Nat) {
    let user = switch (users.get(userId)) {
      case (null) { return };
      case (?u) { u };
    };

    if (Text.equal(user.referredBy, "")) { return };

    let levels : [Nat] = [10, 5, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var currentReferralCode = user.referredBy;
    var level = 0;

    while (level < 15 and not Text.equal(currentReferralCode, "")) {
      switch (users.values().toArray().find(func(u) { Text.equal(u.referralCode, currentReferralCode) })) {
        case (null) { return };
        case (?referrer) {
          let earnings = if (level < 7) {
            levels[level];
          } else {
            0;
          };

          let updatedReferrer = {
            referrer with
            walletBalance = referrer.walletBalance + earnings;
          };
          users.add(referrer.id, updatedReferrer);

          currentReferralCode := referrer.referredBy;
          level += 1;
        };
      };
    };
  };

  // ========== ADMIN INITIALIZATION ==========

  public shared ({ caller }) func initializeAdmin(userProvidedToken : Text) : async () {
    if (adminAssigned) {
      Runtime.trap("Admin already assigned");
    };
    AccessControl.initialize(accessControlState, caller, adminToken, userProvidedToken);
    adminAssigned := true;
  };

  // ========== PUBLIC QUERY (NO AUTH REQUIRED) ==========

  // Fully public - phone-based users connect as anonymous actors
  public query func getUserByPhone(phone : Text) : async ?User {
    let normalizedPhone = normalizePhone(phone);
    switch (phoneToUserId.get(normalizedPhone)) {
      case (null) { null };
      case (?userId) { users.get(userId) };
    };
  };

  public query func getAllVideos() : async [Video] {
    videos.values().toArray();
  };

  public query func getVideosByCategory(category : Text) : async [Video] {
    videos.values().toArray().filter(func(v) { Text.equal(v.category, category) });
  };

  public query func getAllChannelsPublic() : async [UserChannel] {
    userChannels.values().toArray().sort();
  };

  public query func getChannelVideos(channelId : Nat) : async [UserVideo] {
    userVideos.values().toArray().filter(func(v) { v.channelId == channelId });
  };

  // ========== USER REGISTRATION (ANONYMOUS ALLOWED) ==========

  public shared func registerUser(name : Text, email : Text, phone : Text, referralCode : Text) : async Nat {
    let normalizedPhone = normalizePhone(phone);

    // Check for duplicate phone
    switch (phoneToUserId.get(normalizedPhone)) {
      case (?_) { Runtime.trap("Phone number already registered") };
      case (null) {};
    };

    let userId = nextUserId;
    nextUserId += 1;

    let user : User = {
      id = userId;
      name;
      email;
      phone = normalizedPhone;
      referralCode = generateReferralCode(userId);
      referredBy = referralCode;
      walletBalance = 0;
      isActive = false;
      isPaid = false;
      joinedAt = Time.now();
      role = "user";
    };

    users.add(userId, user);
    phoneToUserId.add(normalizedPhone, userId);

    userId;
  };

  // ========== USER FUNCTIONS (PHONE-BASED, NO PRINCIPAL AUTH) ==========

  public shared func submitPaymentProof(input : PaymentSubmissionInput) : async Nat {
    let userOpt = findUserByPhoneInternal(input.phone);
    let userId = switch (userOpt) {
      case (null) { Runtime.trap("User not found for this phone number") };
      case (?user) { user.id };
    };

    let submissionId = nextPaymentSubmissionId;
    nextPaymentSubmissionId += 1;

    let submission : PaymentSubmission = {
      id = submissionId;
      userId;
      name = input.name;
      phone = input.phone;
      utr = input.utr;
      amount = input.amount;
      timestamp = Time.now();
      status = #pending;
    };

    paymentSubmissions.add(submissionId, submission);
    submissionId;
  };

  public shared func recordWatchByPhone(phone : Text, videoId : Nat, watchedSeconds : Nat, completed : Bool, subscribed : Bool) : async () {
    let userOpt = findUserByPhoneInternal(phone);
    switch (userOpt) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let recordId = user.id * 1000000 + videoId;
        let record : WatchRecord = {
          userId = user.id;
          videoId;
          watchedSeconds;
          completed;
          subscribed;
        };
        watchRecords.add(recordId, record);
      };
    };
  };

  // Keep old recordWatch for compatibility
  public shared ({ caller }) func recordWatch(videoId : Nat, watchedSeconds : Nat, completed : Bool, subscribed : Bool) : async () {
    switch (principalToUserId.get(caller)) {
      case (null) { /* ignore if principal not registered */ };
      case (?userId) {
        let recordId = userId * 1000000 + videoId;
        let record : WatchRecord = {
          userId;
          videoId;
          watchedSeconds;
          completed;
          subscribed;
        };
        watchRecords.add(recordId, record);
      };
    };
  };

  public query func getUserWatchTimeByPhone(phone : Text) : async Nat {
    let normalizedPhone = normalizePhone(phone);
    switch (phoneToUserId.get(normalizedPhone)) {
      case (null) { 0 };
      case (?userId) {
        var totalSeconds = 0;
        for (record in watchRecords.values()) {
          if (record.userId == userId) {
            totalSeconds += record.watchedSeconds;
          };
        };
        totalSeconds;
      };
    };
  };

  // Keep old getUserWatchTime for compatibility
  public query ({ caller }) func getUserWatchTime(phone : Text) : async Nat {
    let normalizedPhone = normalizePhone(phone);
    switch (phoneToUserId.get(normalizedPhone)) {
      case (null) { 0 };
      case (?userId) {
        var totalSeconds = 0;
        for (record in watchRecords.values()) {
          if (record.userId == userId) {
            totalSeconds += record.watchedSeconds;
          };
        };
        totalSeconds;
      };
    };
  };

  // ========== PHONE-BASED USER CHANNEL FUNCTIONS (NO PRINCIPAL AUTH) ==========

  public shared func createChannelWithPhone(phone : Text, name : Text, description : Text, thumbnailUrl : Text, bannerUrl : Text) : async Nat {
    let user = switch (findUserByPhoneInternal(phone)) {
      case (null) { Runtime.trap("User not found for this phone number") };
      case (?u) { u };
    };

    let normalizedPhone = normalizePhone(phone);

    var existingChannel = false;
    for (channel in userChannels.values()) {
      if (Text.equal(normalizePhone(channel.ownerPhone), normalizedPhone)) {
        existingChannel := true;
      };
    };

    if (existingChannel) {
      Runtime.trap("Channel already exists for this phone number");
    };

    let channelId = nextChannelId;
    nextChannelId += 1;

    let channel : UserChannel = {
      id = channelId;
      name;
      description;
      ownerPhone = normalizedPhone;
      thumbnailUrl;
      bannerUrl;
      createdAt = Time.now();
    };

    userChannels.add(channelId, channel);
    channelId;
  };

  public query func getMyChannelByPhone(phone : Text) : async ?UserChannel {
    let normalizedPhone = normalizePhone(phone);
    userChannels.values().toArray().find(
      func(c) {
        Text.equal(normalizePhone(c.ownerPhone), normalizedPhone);
      }
    );
  };

  public shared func updateChannelWithPhone(phone : Text, channelId : Nat, name : Text, description : Text, thumbnailUrl : Text, bannerUrl : Text) : async () {
    let normalizedPhone = normalizePhone(phone);

    let channel = switch (userChannels.get(channelId)) {
      case (null) { Runtime.trap("Channel not found") };
      case (?c) { c };
    };

    if (not Text.equal(normalizePhone(channel.ownerPhone), normalizedPhone)) {
      Runtime.trap("Unauthorized: Only channel owner can update");
    };

    let updatedChannel = { channel with name; description; thumbnailUrl; bannerUrl };
    userChannels.add(channelId, updatedChannel);
  };

  public shared func uploadVideoToChannelWithPhone(phone : Text, channelId : Nat, title : Text, url : Text, description : Text, thumbnailUrl : Text, category : Text) : async Nat {
    let normalizedPhone = normalizePhone(phone);

    let channel = switch (userChannels.get(channelId)) {
      case (null) { Runtime.trap("Channel not found") };
      case (?c) { c };
    };

    if (not Text.equal(normalizePhone(channel.ownerPhone), normalizedPhone)) {
      Runtime.trap("Unauthorized: Only channel owner can upload");
    };

    let videoId = nextUserVideoId;
    nextUserVideoId += 1;

    let video : UserVideo = {
      id = videoId;
      channelId;
      title;
      url;
      description;
      thumbnailUrl;
      category;
      ownerPhone = normalizedPhone;
      status = "published";
      createdAt = Time.now();
    };

    userVideos.add(videoId, video);
    videoId;
  };

  public shared func deleteChannelVideoWithPhone(phone : Text, videoId : Nat) : async () {
    let normalizedPhone = normalizePhone(phone);

    let video = switch (userVideos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?v) { v };
    };

    let channel = switch (userChannels.get(video.channelId)) {
      case (null) { Runtime.trap("Channel not found") };
      case (?c) { c };
    };

    if (not Text.equal(normalizePhone(channel.ownerPhone), normalizedPhone)) {
      Runtime.trap("Unauthorized: Only channel owner can delete");
    };

    userVideos.remove(videoId);
  };

  // ========== PASSWORD-GATED ADMIN FUNCTIONS (PASSWORD ONLY, NO PRINCIPAL CHECK) ==========

  public query func getAllUsersWithPassword(password : Text) : async [User] {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    users.values().toArray();
  };

  public query func getAllPaymentSubmissionsWithPassword(password : Text) : async [PaymentSubmission] {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    paymentSubmissions.values().toArray().sort();
  };

  public shared func verifyPaymentSubmissionWithPassword(password : Text, submissionId : Nat) : async () {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    let submission = switch (paymentSubmissions.get(submissionId)) {
      case (null) { Runtime.trap("Payment submission not found") };
      case (?s) { s };
    };

    // Find user by phone from submission
    let userOpt = switch (findUserByPhoneInternal(submission.phone)) {
      case (null) {
        // Fallback: try by userId
        users.get(submission.userId);
      };
      case (?u) { ?u };
    };

    let user = switch (userOpt) {
      case (null) { Runtime.trap("User not found for this payment") };
      case (?u) { u };
    };

    let updatedUser = {
      user with
      isPaid = true;
      isActive = true;
      walletBalance = user.walletBalance + joiningBonus;
    };
    users.add(user.id, updatedUser);

    let updatedSubmission = { submission with status = #approved };
    paymentSubmissions.add(submissionId, updatedSubmission);

    distributeReferralEarnings(user.id);
  };

  public shared func rejectPaymentSubmissionWithPassword(password : Text, submissionId : Nat) : async () {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    let submission = switch (paymentSubmissions.get(submissionId)) {
      case (null) { Runtime.trap("Payment submission not found") };
      case (?s) { s };
    };

    let updatedSubmission = { submission with status = #rejected };
    paymentSubmissions.add(submissionId, updatedSubmission);
  };

  public shared func deletePaymentSubmissionWithPassword(password : Text, submissionId : Nat) : async () {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    paymentSubmissions.remove(submissionId);
  };

  public shared func addVideoWithPassword(password : Text, title : Text, category : Text, url : Text, description : Text, duration : Nat, channelUrl : Text, thumbnailUrl : Text) : async Nat {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
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
      channelUrl;
      thumbnailUrl;
    };

    videos.add(videoId, video);
    videoId;
  };

  public shared func deleteVideoWithPassword(password : Text, videoId : Nat) : async () {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    videos.remove(videoId);
  };

  public shared func editUserWithPassword(password : Text, userId : Nat, name : Text, email : Text, phone : Text) : async () {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    let user = switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    let normalizedPhone = normalizePhone(phone);
    let oldNormalizedPhone = normalizePhone(user.phone);

    if (not Text.equal(normalizedPhone, oldNormalizedPhone)) {
      switch (phoneToUserId.get(normalizedPhone)) {
        case (?existingUserId) {
          if (existingUserId != userId) {
            Runtime.trap("Phone number already in use");
          };
        };
        case (null) {};
      };

      phoneToUserId.remove(oldNormalizedPhone);
      phoneToUserId.add(normalizedPhone, userId);
    };

    let updatedUser = { user with name; email; phone = normalizedPhone };
    users.add(userId, updatedUser);
  };

  public shared func deleteUserWithPassword(password : Text, userId : Nat) : async () {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    let user = switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    let normalizedPhone = normalizePhone(user.phone);
    phoneToUserId.remove(normalizedPhone);
    users.remove(userId);
  };

  public query func getReferralTreeWithPassword(password : Text, userId : Nat) : async ReferralNode {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    buildReferralTree(userId, 0);
  };

  public query func getAllUsersWatchTimeWithPassword(password : Text) : async [{ userId : Nat; phone : Text; name : Text; totalSeconds : Nat }] {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    users.values().toArray().map(
      func(user : User) : { userId : Nat; phone : Text; name : Text; totalSeconds : Nat } {
        var totalSeconds = 0;
        for (record in watchRecords.values()) {
          if (record.userId == user.id) {
            totalSeconds += record.watchedSeconds;
          };
        };
        { userId = user.id; phone = user.phone; name = user.name; totalSeconds };
      }
    );
  };

  public query func getAllChannelsWithPassword(password : Text) : async [UserChannel] {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    userChannels.values().toArray().sort();
  };

  public query func getAllUserVideosWithPassword(password : Text) : async [UserVideo] {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    userVideos.values().toArray();
  };

  public shared func deleteChannelWithPassword(password : Text, channelId : Nat) : async () {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    if (not userChannels.containsKey(channelId)) {
      Runtime.trap("Channel does not exist");
    };
    userChannels.remove(channelId);

    for ((id, video) in userVideos.entries()) {
      if (video.channelId == channelId) {
        userVideos.remove(id);
      };
    };
  };

  public shared func deleteUserVideoWithPassword(password : Text, videoId : Nat) : async () {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    if (not userVideos.containsKey(videoId)) {
      Runtime.trap("Video does not exist");
    };
    userVideos.remove(videoId);
  };

  // ========== ADMIN CHANNEL LINKS MANAGEMENT ==========

  public shared func addChannelWithPassword(password : Text, name : Text, url : Text) : async Nat {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    let channelLinkId = nextChannelLinkId;
    nextChannelLinkId += 1;

    let channelLink : ChannelLink = {
      id = channelLinkId;
      name;
      url;
      createdAt = Time.now();
    };

    channelLinks.add(channelLinkId, channelLink);
    channelLinkId;
  };

  public shared func deleteChannelWithPasswordById(password : Text, channelId : Nat) : async () {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    channelLinks.remove(channelId);
  };

  public query func getAllChannelsListWithPassword(password : Text) : async [ChannelLink] {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    channelLinks.values().toArray();
  };

  // ========== USER PROFILE FUNCTIONS ==========

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };
  // ========== JOINING BONUS MANAGEMENT ==========

  public query func getJoiningBonus() : async Nat {
    joiningBonus;
  };

  public shared func setJoiningBonusWithPassword(password : Text, amount : Nat) : async () {
    if (not verifyPassword(password)) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    joiningBonus := amount;
  };

  // ========== PUBLIC REFERRAL TREE (for user dashboard) ==========

  public query func getReferralTreeByUserId(userId : Nat) : async ?ReferralNode {
    switch (users.get(userId)) {
      case (null) { null };
      case (?_) { ?buildReferralTree(userId, 0) };
    };
  };


};
