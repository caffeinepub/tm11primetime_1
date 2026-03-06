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
    title: string;
    duration: bigint;
    createdAt: bigint;
    description: string;
    category: string;
}
export interface ReferralNode {
    id: bigint;
    referralCode: string;
    name: string;
    children: Array<ReferralNode>;
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
export interface WatchRecord {
    userId: bigint;
    completed: boolean;
    watchedSeconds: bigint;
    subscribed: boolean;
    videoId: bigint;
}
export interface UserProfile {
    userId: bigint;
    name: string;
    email: string;
    phone: string;
}
export interface Transaction {
    id: bigint;
    userId: bigint;
    note: string;
    timestamp: bigint;
    txType: string;
    amount: bigint;
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
    addVideo(title: string, category: string, url: string, description: string, duration: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimFirstAdmin(): Promise<void>;
    deleteUser(userId: bigint): Promise<void>;
    deleteVideo(videoId: bigint): Promise<void>;
    getAllPaymentSubmissions(): Promise<Array<PaymentSubmission>>;
    getAllUsers(): Promise<Array<User>>;
    getAllVideos(): Promise<Array<Video>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyPaymentSubmissions(): Promise<Array<PaymentSubmission>>;
    getMyProfile(userId: bigint): Promise<User>;
    getMyWatchHistory(): Promise<Array<WatchRecord>>;
    getReferralTree(userId: bigint): Promise<ReferralNode>;
    getTransactions(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVideosByCategory(category: string): Promise<Array<Video>>;
    isAdminAssigned(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    recordWatchProgress(videoId: bigint, watchedSeconds: bigint, subscribed: boolean): Promise<void>;
    register(name: string, email: string, phone: string, referredBy: string): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitPaymentProof(input: PaymentSubmissionInput): Promise<bigint>;
    updateUser(userId: bigint, name: string, email: string, phone: string, isActive: boolean): Promise<void>;
    updateUserStatus(userId: bigint, isActive: boolean): Promise<void>;
    verifyPaymentSubmission(submissionId: bigint, action: string): Promise<void>;
}
