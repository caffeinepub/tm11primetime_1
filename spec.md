# Tm11primeTime

## Current State

Multi-level matrix referral platform on ICP. Features:
- Phone-number-only login (no Internet Identity for users)
- Admin login via password (`aakbn@1014`)
- 15-level matrix referral tree (3 slots per node)
- UPI payment flow (₹118); admin can approve/reject/delete
- Wallet with withdrawal request at ₹500+ (document upload required)
- Premium video library (admin-managed, channel links + thumbnails)
- User-created channels and videos (YouTube-style)
- Auto-approval toggle for payments in admin
- Stable variable storage in Motoko backend (data survives upgrades)
- Watch time tracking per user (backend-synced)
- Joining bonus editable from admin (default ₹150)

### Known Root Bug
The `InternetIdentityProvider` in `main.tsx` wraps the entire app and makes async AuthClient network calls on every page load. This causes login to hang/fail because the II initialization delays or errors out, blocking the phone-auth flow entirely.

## Requested Changes (Diff)

### Add
- Nothing new; full feature-complete rebuild

### Modify
- `main.tsx`: Remove `InternetIdentityProvider` wrapper entirely. Wrap only with `QueryClientProvider`. The app uses phone auth only; II is not needed.
- `globalActor.ts`: Ensure actor is pre-initialized at module load without depending on II.
- All login flows: Use single shared actor from `globalActor.ts` only.
- UPI payment page: "Copy" plain text button (not symbol). PhonePe/GPay buttons open app home pages via `window.open()`.
- Matrix tree: Each node shows name (crown), phone (phone icon), referrer name ("by: [name]"), and "referred by [referralID]" below name.
- Dashboard: Watch time read from backend via `getUserWatchTimeByPhone`.
- Joining bonus: Editable from admin panel via `setJoiningBonusWithPassword`.
- Withdrawal: Button visible in wallet when balance ≥ ₹500; document upload required.

### Remove
- `InternetIdentityProvider` from `main.tsx` (root cause of login failures)
- Any II initialization or waiting logic from login flow

## Implementation Plan

1. Regenerate Motoko backend with all stable variables and all required functions
2. Fix `main.tsx` to remove `InternetIdentityProvider` wrapper
3. Fix `LandingPage.tsx` login flow to use single shared actor, correct `?User` unwrapping
4. Fix `RegisterPage.tsx` to use same actor, prevent duplicate registration fallthrough
5. Fix `DashboardPage.tsx` watch time to read from backend
6. Fix `WalletPage.tsx` withdrawal button to show when balance ≥ 500 (no divide by 100)
7. Fix `AdminPage.tsx`: joining bonus editable, withdrawals tab, user watch time column
8. Fix payment page UPI copy + app links
9. Fix matrix tree display with all node fields
