import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  PaymentSubmission,
  PaymentSubmissionInput,
  ReferralNode,
  Transaction,
  User,
  UserProfile,
  Video,
  WatchRecord,
} from "../backend.d";
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

export function useReferralTreeByCode(referralCode: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ReferralNode | null>({
    queryKey: ["referralTreeByCode", referralCode],
    queryFn: async () => {
      if (!actor || !referralCode) return null;
      return actor.getReferralTreeByCode(referralCode);
    },
    enabled: !!actor && !isFetching && !!referralCode,
    // Auto-refresh every 20 seconds so tree updates after new members join
    refetchInterval: 20_000,
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
      return actor.getMyProfile(userId);
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
      return actor.getReferralTree(userId);
    },
    enabled: !!actor && !isFetching && userId !== null,
  });
}

export function useTransactions(userId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["transactions", userId?.toString()],
    queryFn: async () => {
      if (!actor || userId === null) return [];
      return actor.getTransactions();
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
      if (!actor || userId === null) return [];
      return actor.getMyWatchHistory();
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
      return actor.getAllUsers();
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
      return actor.isAdminAssigned();
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
      await actor.claimFirstAdmin();
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
    mutationFn: async (principalText: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.forceSetAdmin(principalText);
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
      await actor.claimFirstAdmin();
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
      const referralCode = await actor.register(name, email, phone, referredBy);
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
      await actor.verifyPaymentSubmissionWithPassword(
        "aakbn@1014",
        submissionId,
        action,
      );
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
      videoId,
      watchedSeconds,
      subscribed,
    }: {
      userId: bigint;
      videoId: bigint;
      watchedSeconds: bigint;
      subscribed: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.recordWatchProgress(videoId, watchedSeconds, subscribed);
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
      userId,
      isActive,
    }: {
      userId: bigint;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateUserStatusWithPassword("aakbn@1014", userId, isActive);
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
    }: {
      title: string;
      category: string;
      url: string;
      description: string;
      duration: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.addVideoWithPassword(
        "aakbn@1014",
        title,
        category,
        url,
        description,
        duration,
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

export function useUpdateUserMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      name,
      email,
      phone,
      isActive,
    }: {
      userId: bigint;
      name: string;
      email: string;
      phone: string;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateUserWithPassword(
        "aakbn@1014",
        userId,
        name,
        email,
        phone,
        isActive,
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
      return actor.getAllVideosPublic();
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
  return useQuery<{
    id: bigint;
    referralCode: string;
    name: string;
    children: Array<ReferralNode>;
    phone: string;
    referredByName: string;
  } | null>({
    queryKey: ["referralTreeByPhoneAdmin", phone],
    queryFn: async () => {
      if (!actor || !phone) return null;
      return actor.getReferralTreeByPhoneWithPassword("aakbn@1014", phone);
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
        return await actor.getAllReferralTreesWithPassword("aakbn@1014");
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
