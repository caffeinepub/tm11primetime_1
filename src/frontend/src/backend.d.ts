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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addVideo(title: string, category: string, url: string, description: string, duration: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completePayment(userId: bigint): Promise<void>;
    deleteVideo(videoId: bigint): Promise<void>;
    getAllUsers(): Promise<Array<User>>;
    getAllVideos(): Promise<Array<Video>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyProfile(userId: bigint): Promise<User>;
    getMyWatchHistory(userId: bigint): Promise<Array<WatchRecord>>;
    getReferralTree(userId: bigint): Promise<ReferralNode>;
    getTransactions(userId: bigint): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVideosByCategory(category: string): Promise<Array<Video>>;
    isCallerAdmin(): Promise<boolean>;
    recordWatchProgress(userId: bigint, videoId: bigint, watchedSeconds: bigint, subscribed: boolean): Promise<void>;
    register(name: string, email: string, phone: string, referredBy: string): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateUserStatus(userId: bigint, isActive: boolean): Promise<void>;
}
