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
      return actor.getTransactions(userId);
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
      return actor.getMyWatchHistory(userId);
    },
    enabled: !!actor && !isFetching && userId !== null,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<User[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllPaymentSubmissions() {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentSubmission[]>({
    queryKey: ["allPaymentSubmissions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPaymentSubmissions();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useIsAdminAssigned() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdminAssigned"],
    queryFn: async () => {
      if (!actor) return false;
      return (actor as any).isAdminAssigned();
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
      await (actor as any).claimFirstAdmin();
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
    mutationFn: async (secret: string) => {
      if (!actor) throw new Error("Not connected");
      await (actor as any)._initializeAccessControlWithSecret(secret);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
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
      if (!actor) throw new Error("Not connected");
      return actor.submitPaymentProof(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
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
      await actor.verifyPaymentSubmission(submissionId, action);
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
      userId,
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
      await actor.recordWatchProgress(
        userId,
        videoId,
        watchedSeconds,
        subscribed,
      );
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
      await actor.updateUserStatus(userId, isActive);
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
      await actor.addVideo(title, category, url, description, duration);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

export function useDeleteVideoMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
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
