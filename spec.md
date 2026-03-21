# Tm11primeTime

## Current State
Full-featured matrix referral platform with phone-based login, UPI payments, 15-level matrix tree, video library, and admin panel. Stable storage persists data across upgrades. Login flow checks phone → logs in if registered → shows registration form for new users.

## Requested Changes (Diff)

### Add
- `joiningBonus` stable variable in backend (default 150), with `getJoiningBonus()` query and `setJoiningBonusWithPassword(password, amount)` admin function
- `referredByCode` field in `ReferralNode` type (the referrer's referral code/ID)
- Admin panel UI field to view/edit joining bonus amount (in a Settings section or at top of Payments tab)
- Watch time fetched from backend via `getUserWatchTimeByPhone` and displayed as minutes in dashboard stat card

### Modify
- `verifyPaymentSubmissionWithPassword`: use `joiningBonus` variable instead of hardcoded 150
- `buildReferralTree`: populate `referredByCode` for each node
- Matrix tree nodes: show referrer's referral ID (referredByCode) below user name
- Dashboard watch time stat: query from backend `getUserWatchTimeByPhone`, display as "X min" or "Xh Ym"
- Login flow: make actor initialization more robust; ensure registered phone always logs in directly

### Remove
- Watch time reading from localStorage in DashboardPage (replace with backend query)

## Implementation Plan
1. Update Motoko backend: add `joiningBonus` stable var, `getJoiningBonus` query, `setJoiningBonusWithPassword` update, add `referredByCode` to ReferralNode, update buildReferralTree and verifyPaymentSubmissionWithPassword
2. Update frontend login flow (RegisterPage): ensure phone check always runs with fresh actor and properly routes to dashboard
3. Update DashboardPage: fetch watch time from backend, display in minutes; update matrix node to show referredByCode below name
4. Update AdminPage: add editable joining bonus field in Payments/Settings area
