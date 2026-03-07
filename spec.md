# Tm11primeTime

## Current State

Phone-based registration and login system with UPI payment, 15-level referral earnings, premium video library, wallet, and admin panel (password-based).

**Root cause of current bugs:**
1. `getUserByPhone` backend function requires `#user` role permission -- but phone-based users use an anonymous actor (no Internet Identity), so the auth check always fails. This causes: (a) returning users always see the registration form again, and (b) the admin panel cannot find users linked to payments.
2. `verifyPaymentSubmissionWithPassword` approval logic tries `users.get(submission.userId)` first -- but for users registered via anonymous actor, the userId stored in the submission may be 0 or wrong, so it falls back to phone lookup. The phone lookup itself works, but the issue is that `getUserByPhone` being auth-gated means the registration step fails with "Phone number already registered" after the first registration attempt (the user IS saved but can't be found by anonymous actors on subsequent logins).

## Requested Changes (Diff)

### Add
- New public (no auth) backend function `getUserByPhonePublic(phone: Text)` that returns a User without any permission check -- safe for anonymous callers, used for phone-based login
- Password-gated `deletePaymentSubmissionWithPassword(password: Text, submissionId: Nat)` function to permanently delete payment records from backend (not just hide them in localStorage)

### Modify
- `getUserByPhone` -- make it fully public (remove the `#user` permission check), since phone is the user's own identifier for lookup, and restricting it to authenticated users breaks the phone-based login flow
- `verifyPaymentSubmissionWithPassword` -- ensure it always resolves the user by phone as fallback when userId is 0, and updates the submission's userId to the found user's id before approving
- `getAllUsersWithPassword` -- keep as-is (already works correctly)
- `getAllPaymentSubmissionsWithPassword` -- keep as-is (already works correctly)

### Remove
- Nothing removed

## Implementation Plan

1. Regenerate backend Motoko with `getUserByPhone` made public (no caller auth check), add `getUserByPhonePublic` as alias, and add `deletePaymentSubmissionWithPassword`
2. Update `useQueries.ts`: add `useDeletePaymentSubmissionMutation` that calls the new backend function
3. Update `AdminPage.tsx`: replace localStorage-based payment hiding with real backend deletion using the new mutation
4. Ensure `useAllUsers` and `useAllPaymentSubmissions` hooks still use password-gated functions (already correct)
