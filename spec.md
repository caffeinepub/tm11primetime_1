# Tm11primeTime

## Current State
- Full membership app with phone-based login, UPI payment flow, 15-level referral matrix, wallet, and premium video library.
- Admin panel uses password login (`aakbn@1014`) with tabs for Users, Payments, Videos, Stats.
- Payment submissions are manually approved/rejected by the admin in the Payments tab.
- Backend has `submitPaymentProof` (public), `verifyPaymentSubmissionWithPassword` (password-gated), and related functions.
- No auto-approval logic exists.

## Requested Changes (Diff)

### Add
- **Backend**: `autoApproveEnabled` boolean variable (default `false`) stored in actor state.
- **Backend**: `setAutoApproveWithPassword(password, enabled)` -- password-gated function to toggle auto-approval on/off.
- **Backend**: `getAutoApproveStatus(password)` -- password-gated query to read current toggle state.
- **Backend**: Auto-approval logic inside `submitPaymentProof`: when `autoApproveEnabled == true`, validate the submission (UTR format: exactly 12 digits, amount == "118", no duplicate UTR) and if valid, immediately run approval logic (credit Rs.150 bonus, distribute level earnings, mark isPaid=true, set status=#approved). If validation fails, still store as #rejected with a reason.
- **Frontend**: Auto-Approve toggle card in the Payments tab header of AdminPage, showing current ON/OFF state. Toggling it calls `setAutoApproveWithPassword`. Shows validation rules as helper text below the toggle.

### Modify
- **Backend**: `submitPaymentProof` -- add auto-approval branch after storing the submission.
- **Frontend**: AdminPage Payments tab header -- add the auto-approve toggle card between the title and the Refresh button.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `autoApproveEnabled` state variable and helper approval function `approvePaymentById` (extracted from `verifyPaymentSubmissionWithPassword`) in `main.mo`.
2. Add `setAutoApproveWithPassword` and `getAutoApproveStatusWithPassword` backend functions.
3. Modify `submitPaymentProof` to check `autoApproveEnabled`, validate (UTR 12 digits, amount=="118", no duplicate UTR), and auto-approve or auto-reject.
4. Add `useAutoApproveStatus` query hook and `useSetAutoApproveMutation` in `useQueries.ts`.
5. Add auto-approve toggle UI in AdminPage Payments tab header -- Switch component with label, current status badge, and validation rules helper text.
