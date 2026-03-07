# Tm11primeTime

## Current State

Full-stack membership + referral app. Backend uses Motoko with principal-based authorization from the `MixinAuthorization` component. Frontend uses React + TypeScript with phone-number-based login (no Internet Identity for regular users) and a password-based admin panel (password: `aakbn@1014`, stored in `localStorage`).

**Core bug:** The admin panel login is password-only (no blockchain identity). All backend admin functions (`getAllUsers`, `getAllPaymentSubmissions`, `verifyPaymentSubmission`, `updateUser`, `deleteUser`, `addVideo`, `deleteVideo`, `updateUserStatus`) require the caller to have the `#admin` role in the blockchain access control system. Since the password-based admin session has no blockchain identity, these calls go out as anonymous principal and get rejected, returning empty results or errors. The admin panel shows Users (0) and no payment submissions even though data exists.

## Requested Changes (Diff)

### Add
- New backend functions gated by admin password text parameter (not principal):
  - `getAllUsersWithPassword(password)` -- returns all users if password matches
  - `getAllPaymentSubmissionsWithPassword(password)` -- returns all payment submissions if password matches
  - `verifyPaymentSubmissionWithPassword(password, submissionId, action)` -- approves or rejects payment; on approval, correctly finds user by phone when userId=0 (user registered after submission), credits Rs.150 joining bonus, distributes level earnings up to 15 levels
  - `updateUserWithPassword(password, userId, name, email, phone, isActive)` -- updates user
  - `deleteUserWithPassword(password, userId)` -- deletes user and cleans up all related data
  - `addVideoWithPassword(password, title, category, url, description, duration)` -- adds video
  - `deleteVideoWithPassword(password, videoId)` -- deletes video
  - `updateUserStatusWithPassword(password, userId, isActive)` -- toggles user active status
  - `getAllVideosPublic()` -- public query, no auth, returns all videos (for admin panel video tab)
- The admin password is hardcoded as `"aakbn@1014"` in the backend

### Modify
- Frontend `useQueries.ts`: update `useAllUsers`, `useAllPaymentSubmissions` to call the new `WithPassword` variants, passing `ADMIN_PASSWORD`
- Frontend `useQueries.ts`: update `useUpdateUserStatusMutation`, `useUpdateUserMutation`, `useDeleteUserMutation`, `useVerifyPaymentSubmissionMutation`, `useAddVideoMutation`, `useDeleteVideoMutation` to call the new `WithPassword` variants
- Frontend `AdminPage.tsx`: `useAllVideos` should use `getAllVideosPublic` instead of `getAllVideos` (which is restricted to paid users)

### Remove
- Nothing removed

## Implementation Plan

1. Regenerate Motoko backend with all existing functions preserved plus new password-gated admin functions and public video getter
2. Update `useQueries.ts` to use the new password-gated function calls for admin operations
3. Validate (typecheck + build) and deploy
