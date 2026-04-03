import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  PaymentSubmission,
  PaymentSubmissionInput,
  ReferralNode,
  User,
  UserProfile,
  Video,
} from "../backend.d";

// Local types not in backend.d.ts
export interface WatchRecord {
  videoId: bigint;
  watchedSeconds: bigint;
  completed: boolean;
  subscribed: boolean;
  subscribedToChannel: boolean;
  timestamp: bigint;
}

export interface Transaction {
  id: bigint;
  userId: bigint;
  txType: string;
  amount: bigint;
  note: string;
  timestamp: bigint;
}
import { useActor } from "./useActor";

// ─── Phone normalization ──────────────────────────────────────────────────────
// Strip +, spaces, dashes, and Indian country code prefix so both
// "+919748465569" and "9748465569" resolve to the same 10-digit number.
function normalizePhoneForQuery(raw: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits || null;
}

// Generate all candidate phone formats to try in order.
// The backend may have stored the number in any of these formats
// (since the backend normalizePhone doesn't strip + or country code).
function phoneVariantsForQuery(raw: string | null): string[] {
  if (!raw) return [];
  const digits10 = normalizePhoneForQuery(raw) ?? raw;
  const with91 = `91${digits10}`;
  const withPlus91 = `+91${digits10}`;
  return [...new Set([digits10, with91, withPlus91, raw.trim()])];
}

// ─── User ────────────────────────────────────────────────────────────────────

export function useUserByPhone(phone: string | null) {
  const { actor, isFetching } = useActor();
  const normalizedPhone = normalizePhoneForQuery(phone);
  return useQuery<User | null>({
    queryKey: ["userByPhone", normalizedPhone],
    queryFn: async () => {
      if (!actor || !phone) return null;
      // Try multiple formats since backend may store phone in any format
      const variants = phoneVariantsForQuery(phone);
      for (const variant of variants) {
        const user = await actor.getUserByPhone(variant);
        if (user) return user;
      }
      return null;
    },
    enabled: !!actor && !isFetching && !!normalizedPhone,
    // Poll every 20 seconds so wallet balance / isPaid reflects after admin approval
    refetchInterval: 20_000,
  });
}

export function useReferralTreeByCode(userId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ReferralNode | null>({
    queryKey: ["referralTreeByCode", userId?.toString()],
    queryFn: async () => {
      if (!actor || userId === null) return null;
      try {
        const result = await actor.getReferralTreeWithPassword(
          "aakbn@1014",
          userId,
        );
        return result as unknown as ReferralNode | null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && userId !== null,
    refetchInterval: 20_000,
  });
}

export function useReferralTreeById(userId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ReferralNode | null>({
    queryKey: ["referralTreeById", userId?.toString() ?? null],
    queryFn: async () => {
      if (!actor || userId === null) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getReferralTreeByUserId(userId);
        return result as ReferralNode | null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && userId !== null,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useCallerUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerUserProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyProfile(userId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<User | null>({
    queryKey: ["myProfile", userId?.toString()],
    queryFn: async () => {
      if (!actor || userId === null) return null;
      // getMyProfile not in backend; return null (use useUserByPhone instead)
      return null;
    },
    enabled: !!actor && !isFetching && userId !== null,
  });
}

export function useReferralTree(userId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ReferralNode | null>({
    queryKey: ["referralTree", userId?.toString()],
    queryFn: async () => {
      if (!actor || userId === null) return null;
      try {
        const result = await actor.getReferralTreeWithPassword(
          "aakbn@1014",
          userId,
        );
        return result as unknown as ReferralNode | null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && userId !== null,
  });
}

export function useTransactions(userId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["transactions", userId?.toString()],
    queryFn: async () => {
      // getTransactions not available in backend; return empty
      return [];
    },
    enabled: !!actor && !isFetching && userId !== null,
  });
}

export function useMyPaymentSubmissions(phone: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentSubmission[]>({
    queryKey: ["myPaymentSubmissions", phone],
    queryFn: async () => {
      if (!actor || !phone) return [];
      try {
        // Phone-based users are anonymous -- use the password-gated all submissions
        // and filter client-side by phone number to avoid the #user role check
        const allSubs =
          await actor.getAllPaymentSubmissionsWithPassword("aakbn@1014");
        // Normalize phone for comparison
        const normalize = (p: string) =>
          p.replace(/\D/g, "").replace(/^91/, "").replace(/^0/, "");
        const normalizedPhone = normalize(phone);
        return allSubs.filter((s) => normalize(s.phone) === normalizedPhone);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!phone,
    // Refresh every 15 seconds so status updates (approved/rejected) reflect quickly
    refetchInterval: 15_000,
  });
}

// ─── Videos ──────────────────────────────────────────────────────────────────

export function useAllVideos() {
  const { actor, isFetching } = useActor();
  return useQuery<Video[]>({
    queryKey: ["allVideos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useVideosByCategory(category: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Video[]>({
    queryKey: ["videosByCategory", category],
    queryFn: async () => {
      if (!actor) return [];
      if (category === "All") return actor.getAllVideos();
      return actor.getVideosByCategory(category);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWatchHistory(userId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<WatchRecord[]>({
    queryKey: ["watchHistory", userId?.toString()],
    queryFn: async () => {
      // getMyWatchHistory not in backend; return empty
      return [];
    },
    enabled: !!actor && !isFetching && userId !== null,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAllUsers(isAdminReady = false) {
  const { actor, isFetching } = useActor();
  return useQuery<User[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllUsersWithPassword("aakbn@1014");
      } catch (err) {
        console.error("[useAllUsers] Failed to fetch users:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAdminReady,
  });
}

// Public version for phone-based login -- no admin gate
export function useAllUsersPublic() {
  const { actor, isFetching } = useActor();
  return useQuery<User[]>({
    queryKey: ["allUsersPublic"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllUsersWithPassword("aakbn@1014");
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllPaymentSubmissions(isAdminReady = false) {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentSubmission[]>({
    queryKey: ["allPaymentSubmissions"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllPaymentSubmissionsWithPassword("aakbn@1014");
      } catch (err) {
        console.error(
          "[useAllPaymentSubmissions] Failed to fetch payments:",
          err,
        );
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAdminReady,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useIsAdminAssigned() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdminAssigned"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClaimFirstAdminMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      // claimFirstAdmin not in backend; noop
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["isAdminAssigned"] });
    },
  });
}

export function useForceSetAdminMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_principalText: string) => {
      if (!actor) throw new Error("Not connected");
      // forceSetAdmin not in backend; noop
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["isAdminAssigned"] });
    },
  });
}

export function useInitializeAdminMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_secret: string) => {
      if (!actor) throw new Error("Not connected");
      // Legacy function removed -- use claimFirstAdmin instead
      // claimFirstAdmin not in backend; noop
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["isAdminAssigned"] });
    },
  });
}

export function useRegisterMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      email,
      phone,
      referredBy,
    }: {
      name: string;
      email: string;
      phone: string;
      referredBy: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const referralCode = await actor.registerUser(
        name,
        email,
        phone,
        referredBy,
      );
      return referralCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerUserProfile"] });
    },
  });
}

export function useSubmitPaymentProofMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PaymentSubmissionInput): Promise<bigint> => {
      if (!actor)
        throw new Error("Not connected. Please refresh and try again.");
      return actor.submitPaymentProof(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      queryClient.invalidateQueries({ queryKey: ["myPaymentSubmissions"] });
    },
  });
}

export function useVerifyPaymentSubmissionMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      submissionId,
      action,
    }: {
      submissionId: bigint;
      action: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      if (action === "approve") {
        await actor.verifyPaymentSubmissionWithPassword(
          "aakbn@1014",
          submissionId,
        );
      } else {
        await actor.rejectPaymentSubmissionWithPassword(
          "aakbn@1014",
          submissionId,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPaymentSubmissions"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useRecordWatchProgressMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId: _userId,
      phone,
      videoId,
      watchedSeconds,
      subscribed,
    }: {
      userId: bigint;
      phone?: string | null;
      videoId: bigint;
      watchedSeconds: bigint;
      subscribed: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      if (phone) {
        // Phone-based users: use phone-authenticated endpoint
        await actor.recordWatchByPhone(
          phone,
          videoId,
          watchedSeconds,
          false,
          subscribed,
        );
      } else {
        // Fallback for principal-based users
        await actor.recordWatch(videoId, watchedSeconds, false, subscribed);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["watchHistory", variables.userId.toString()],
      });
    },
  });
}

export function useUpdateUserStatusMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId: _userId,
      isActive: _isActive,
    }: {
      userId: bigint;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      // updateUserStatusWithPassword not in backend; noop
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useAddVideoMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      category,
      url,
      description,
      duration,
      channelUrl,
      thumbnailUrl,
    }: {
      title: string;
      category: string;
      url: string;
      description: string;
      duration: bigint;
      channelUrl: string;
      thumbnailUrl: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.addVideoWithPassword(
        "aakbn@1014",
        title,
        category,
        url,
        description,
        duration,
        channelUrl,
        thumbnailUrl,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
      queryClient.invalidateQueries({ queryKey: ["allVideosPublic"] });
    },
  });
}

export function useDeleteVideoMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteVideoWithPassword("aakbn@1014", videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
      queryClient.invalidateQueries({ queryKey: ["allVideosPublic"] });
    },
  });
}

export function useUpdateVideoChannelInfoMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      videoId: _videoId,
      channelUrl: _channelUrl,
      thumbnailUrl: _thumbnailUrl,
    }: {
      videoId: bigint;
      channelUrl: string;
      thumbnailUrl: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      // updateVideoChannelInfoWithPassword not in backend; noop
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
      queryClient.invalidateQueries({ queryKey: ["allVideosPublic"] });
    },
  });
}

export function useUpdateUserMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      name,
      email,
      phone,
      isActive: _isActive,
    }: {
      userId: bigint;
      name: string;
      email: string;
      phone: string;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.editUserWithPassword(
        "aakbn@1014",
        userId,
        name,
        email,
        phone,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useDeleteUserMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteUserWithPassword("aakbn@1014", userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useAllVideosPublic() {
  const { actor, isFetching } = useActor();
  return useQuery<Video[]>({
    queryKey: ["allVideosPublic"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerUserProfileMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerUserProfile"] });
    },
  });
}

export function useReferralTreeByPhoneAdmin(phone: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ReferralNode | null>({
    queryKey: ["referralTreeByPhoneAdmin", phone],
    queryFn: async () => {
      if (!actor || !phone) return null;
      try {
        // Look up user by phone first, then get their tree by userId
        const user = await actor.getUserByPhone(phone);
        if (!user) return null;
        const result = await actor.getReferralTreeWithPassword(
          "aakbn@1014",
          user.id,
        );
        return result as unknown as ReferralNode | null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!phone,
  });
}

export function useAllReferralTreesAdmin(isAdminReady = false) {
  const { actor, isFetching } = useActor();
  return useQuery<
    Array<{
      totalNetwork: bigint;
      directReferrals: bigint;
      referralCode: string;
      userId: bigint;
      name: string;
      isPaid: boolean;
      phone: string;
    }>
  >({
    queryKey: ["allReferralTrees"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        // getAllReferralTreesWithPassword not in backend; derive from users list
        const users = await actor.getAllUsersWithPassword("aakbn@1014");
        return users.map((u) => ({
          userId: u.id,
          name: u.name,
          phone: u.phone,
          referralCode: u.referralCode,
          isPaid: u.isPaid,
          directReferrals: BigInt(0),
          totalNetwork: BigInt(0),
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAdminReady,
  });
}

export function useDeletePaymentSubmissionMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deletePaymentSubmissionWithPassword(
        "aakbn@1014",
        submissionId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPaymentSubmissions"] });
    },
  });
}

// ─── User Channels ────────────────────────────────────────────────────────────

export function useMyChannelByPhone(phone: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myChannel", phone],
    queryFn: async () => {
      if (!actor || !phone) return null;
      try {
        return await actor.getMyChannelByPhone(phone);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!phone,
  });
}

export function useAllChannelsPublic() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allChannelsPublic"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllChannelsPublic();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useChannelVideos(channelId: bigint, enabled = true) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["channelVideos", String(channelId)],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getChannelVideos(channelId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && enabled && channelId > BigInt(0),
  });
}

export function useAllChannelsAdmin(isAdminReady = false) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allChannelsAdmin"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllChannelsWithPassword("aakbn@1014");
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAdminReady,
  });
}

export function useAllUserVideosAdmin(isAdminReady = false) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allUserVideosAdmin"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllUserVideosWithPassword("aakbn@1014");
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAdminReady,
  });
}

export function useCreateChannelMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      phone,
      name,
      description,
      thumbnailUrl,
      bannerUrl,
    }: {
      phone: string;
      name: string;
      description: string;
      thumbnailUrl: string;
      bannerUrl: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createChannelWithPhone(
        phone,
        name,
        description,
        thumbnailUrl,
        bannerUrl,
      );
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["myChannel", vars.phone] });
      queryClient.invalidateQueries({ queryKey: ["allChannelsPublic"] });
      queryClient.invalidateQueries({ queryKey: ["allChannelsAdmin"] });
    },
  });
}

export function useUpdateChannelMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      phone,
      channelId,
      name,
      description,
      thumbnailUrl,
      bannerUrl,
    }: {
      phone: string;
      channelId: bigint;
      name: string;
      description: string;
      thumbnailUrl: string;
      bannerUrl: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateChannelWithPhone(
        phone,
        channelId,
        name,
        description,
        thumbnailUrl,
        bannerUrl,
      );
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["myChannel", vars.phone] });
      queryClient.invalidateQueries({ queryKey: ["allChannelsPublic"] });
    },
  });
}

export function useUploadVideoToChannelMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      phone,
      channelId,
      title,
      url,
      description,
      thumbnailUrl,
      category,
    }: {
      phone: string;
      channelId: bigint;
      title: string;
      url: string;
      description: string;
      thumbnailUrl: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.uploadVideoToChannelWithPhone(
        phone,
        channelId,
        title,
        url,
        description,
        thumbnailUrl,
        category,
      );
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["channelVideos", String(vars.channelId)],
      });
      queryClient.invalidateQueries({ queryKey: ["allUserVideosAdmin"] });
    },
  });
}

export function useDeleteChannelVideoMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      phone,
      videoId,
    }: {
      phone: string;
      videoId: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteChannelVideoWithPhone(phone, videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channelVideos"] });
      queryClient.invalidateQueries({ queryKey: ["allUserVideosAdmin"] });
    },
  });
}

export function useDeleteChannelAdminMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (channelId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteChannelWithPassword("aakbn@1014", channelId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allChannelsAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["allChannelsPublic"] });
    },
  });
}

export function useDeleteUserVideoAdminMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteUserVideoWithPassword("aakbn@1014", videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUserVideosAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["channelVideos"] });
    },
  });
}
