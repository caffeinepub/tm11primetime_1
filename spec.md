# Tm11primeTime

## Current State
Full-stack ICP app with Motoko backend (stable storage, all user/payment/video/channel data persisted) and React frontend. Backend has all required functions: phone-based auth, referral matrix, payments, videos, channels, withdrawals, watch time.

## Requested Changes (Diff)

### Add
- Nothing new; this is a rebuild/redeploy of the existing full feature set

### Modify
- Ensure all existing features are properly wired and working

### Remove
- Nothing

## Implementation Plan

1. Rebuild frontend with all existing pages: LandingPage, RegisterPage, DashboardPage, WalletPage, VideosPage, VideoPlayerPage, ChannelsPage, AdminPage, MyChannelTab, Layout
2. Ensure login uses single shared anonymous backend actor created before app renders
3. Phone normalization: strip +91/91 prefix, try all formats
4. Auto-login if phone stored in localStorage
5. Matrix tree: 3 fixed slots per level, shows name, phone, referrer name, referredBy referral ID, auto-refreshes every 20s
6. Payment flow: UPI QR, UTR entry, amount locked at Rs.118
7. Video library: public access, channel links, thumbnails from backend
8. Admin panel: password aakbn@1014, all tabs (Users, Payments, Videos, Channels, Matrix, User Channels, Withdrawals)
9. Auto-approval toggle in admin payments tab
10. Wallet page: withdrawal button when balance >= 500, document upload
11. Watch time tracked in backend, displayed in dashboard and admin
12. Joining bonus editable from admin (default Rs.150)
