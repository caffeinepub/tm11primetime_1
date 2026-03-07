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

// ─── User ────────────────────────────────────────────────────────────────────

export function useUserByPhone(phone: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<User | null>({
    queryKey: ["userByPhone", phone],
    queryFn: async () => {
      if (!actor || !phone) return null;
      return actor.getUserByPhone(phone);
    },
    enabled: !!actor && !isFetching && !!phone,
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
      } catch {
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
      } catch {
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
