import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Video {
    id: bigint;
    url: string;
    channelUrl: string;
    title: string;
    duration: bigint;
    thumbnailUrl: string;
    createdAt: bigint;
    description: string;
    category: string;
}
export interface PaymentSubmissionInput {
    utr: string;
    name: string;
    phone: string;
    amount: string;
}
export interface PaymentSubmission {
    id: bigint;
    utr: string;
    status: PaymentStatus;
    userId: bigint;
    name: string;
    timestamp: bigint;
    phone: string;
    amount: string;
}
export interface User {
    id: bigint;
    referralCode: string;
    name: string;
    joinedAt: bigint;
    role: string;
    isPaid: boolean;
    isActive: boolean;
    email: string;
    referredBy: string;
    phone: string;
    walletBalance: bigint;
}
export interface UserChannel {
    id: bigint;
    thumbnailUrl: string;
    name: string;
    createdAt: bigint;
    ownerPhone: string;
    description: string;
    bannerUrl: string;
}
export interface UserVideo {
    id: bigint;
    url: string;
    status: string;
    title: string;
    thumbnailUrl: string;
    channelId: bigint;
    createdAt: bigint;
    ownerPhone: string;
    description: string;
    category: string;
}
export interface ChannelLink {
    id: bigint;
    url: string;
    name: string;
    createdAt: bigint;
}
export interface UserProfile {
    userId: bigint;
    name: string;
    email: string;
    phone: string;
}
export interface ReferralNode {
    id: bigint;
    referralCode: string;
    referredByCode: string;
    name: string;
    children: Array<ReferralNode>;
    phone: string;
    referredByName: string;
}
export enum PaymentStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addChannelWithPassword(password: string, name: string, url: string): Promise<bigint>;
    addVideoWithPassword(password: string, title: string, category: string, url: string, description: string, duration: bigint, channelUrl: string, thumbnailUrl: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createChannelWithPhone(phone: string, name: string, description: string, thumbnailUrl: string, bannerUrl: string): Promise<bigint>;
    deleteChannelVideoWithPhone(phone: string, videoId: bigint): Promise<void>;
    deleteChannelWithPassword(password: string, channelId: bigint): Promise<void>;
    deleteChannelWithPasswordById(password: string, channelId: bigint): Promise<void>;
    deletePaymentSubmissionWithPassword(password: string, submissionId: bigint): Promise<void>;
    deleteUserVideoWithPassword(password: string, videoId: bigint): Promise<void>;
    deleteUserWithPassword(password: string, userId: bigint): Promise<void>;
    deleteVideoWithPassword(password: string, videoId: bigint): Promise<void>;
    editUserWithPassword(password: string, userId: bigint, name: string, email: string, phone: string): Promise<void>;
    getAllChannelsListWithPassword(password: string): Promise<Array<ChannelLink>>;
    getAllChannelsPublic(): Promise<Array<UserChannel>>;
    getAllChannelsWithPassword(password: string): Promise<Array<UserChannel>>;
    getAllPaymentSubmissionsWithPassword(password: string): Promise<Array<PaymentSubmission>>;
    getAllUserVideosWithPassword(password: string): Promise<Array<UserVideo>>;
    getAllUsersWatchTimeWithPassword(password: string): Promise<Array<{
        totalSeconds: bigint;
        userId: bigint;
        name: string;
        phone: string;
    }>>;
    getAllUsersWithPassword(password: string): Promise<Array<User>>;
    getAllVideos(): Promise<Array<Video>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChannelVideos(channelId: bigint): Promise<Array<UserVideo>>;
    getMyChannelByPhone(phone: string): Promise<UserChannel | null>;
    getReferralTreeWithPassword(password: string, userId: bigint): Promise<ReferralNode>;
    getUserByPhone(phone: string): Promise<User | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserWatchTime(phone: string): Promise<bigint>;
    getUserWatchTimeByPhone(phone: string): Promise<bigint>;
    getVideosByCategory(category: string): Promise<Array<Video>>;
    initializeAdmin(userProvidedToken: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    recordWatch(videoId: bigint, watchedSeconds: bigint, completed: boolean, subscribed: boolean): Promise<void>;
    recordWatchByPhone(phone: string, videoId: bigint, watchedSeconds: bigint, completed: boolean, subscribed: boolean): Promise<void>;
    registerUser(name: string, email: string, phone: string, referralCode: string): Promise<bigint>;
    rejectPaymentSubmissionWithPassword(password: string, submissionId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitPaymentProof(input: PaymentSubmissionInput): Promise<bigint>;
    updateChannelWithPhone(phone: string, channelId: bigint, name: string, description: string, thumbnailUrl: string, bannerUrl: string): Promise<void>;
    uploadVideoToChannelWithPhone(phone: string, channelId: bigint, title: string, url: string, description: string, thumbnailUrl: string, category: string): Promise<bigint>;
    verifyPaymentSubmissionWithPassword(password: string, submissionId: bigint): Promise<void>;
    getJoiningBonus(): Promise<bigint>;
    setJoiningBonusWithPassword(password: string, amount: bigint): Promise<void>;
    getReferralTreeByUserId(userId: bigint): Promise<ReferralNode | null>;
    getUserWatchTimeByPhone(phone: string): Promise<bigint>;
}
