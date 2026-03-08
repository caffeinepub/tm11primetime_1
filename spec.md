# Tm11primeTime

## Current State

- Full-stack MLM app with phone-based login, 15-level referral earnings, matrix tree, premium video library (6 categories), wallet, payment submission/approval, admin panel (password: aakbn@1014).
- Admin panel has tabs: Users, Payments, Videos, Stats.
- Videos tab allows admin to add/delete videos with title, category, URL, description, duration.
- Watch history is recorded per user via `recordWatchProgress` backend function (videoId, watchedSeconds, subscribed).
- `WatchRecord` has: userId, videoId, watchedSeconds, completed, subscribed.
- Backend exposes `getMyWatchHistory()` (returns WatchRecord[]) -- used in VideosPage/VideoPlayerPage.
- No channel URL management exists in admin panel.
- No total watch time display exists anywhere.

## Requested Changes (Diff)

### Add
- **Admin: Channels tab** -- new tab in admin panel where admin can add/edit/delete multiple channel URLs (name + URL). Store channel list in localStorage (frontend-only, no backend change needed since backend already has video URLs per video). Admin can save channel name + URL pairs.
- **Admin: User Watch Time column** -- in the Users tab, add a "Watch Time" column showing each user's total watch time (sum of all their watchedSeconds across all WatchRecords). Admin fetches all watch records via backend's `getMyWatchHistory` is per-user only -- use `getAllUsersWithPassword` + per-user watch data. Since there's no `getAllWatchRecords` admin endpoint, compute total watch time from the available `WatchRecord[]` stored client-side from user's own watch session, or show per-user totals using records from admin's fetched data.
- **Dashboard: Total Watch Time card** -- on user dashboard, show a stat card displaying total video watch time (sum of all watchedSeconds) formatted as "X hr Y min".

### Modify
- **AdminPage.tsx**: Add "Channels" tab, add Watch Time column to Users table.
- **DashboardPage.tsx**: Add total watch time stat card alongside existing stats (wallet, direct referrals, network size).

### Remove
- Nothing removed.

## Implementation Plan

1. **Frontend: useWatchHistory hook** -- already exists in useQueries.ts; use it in DashboardPage to compute total watch time from `getMyWatchHistory()`.
2. **Frontend: DashboardPage** -- add `useWatchHistory` for logged-in user's watch records. Compute total seconds, format as "X hr Y min Z sec". Add a new stat card (4th card in the stats grid, or replace one) with a "Watch Time" display.
3. **Frontend: AdminPage** -- 
   - Add "Channels" tab with a simple CRUD list stored in localStorage (channelName + channelURL). Add/edit/delete channel rows. No backend required.
   - Add "Watch Time" column to Users table. Since there's no backend endpoint to get all users' watch records, compute this from a new `getAllWatchRecordsWithPassword` or use frontend-only approach: show N/A or fetch per-user data lazily. Given backend limitation, display watch time in admin using a new `useAllWatchRecords` hook that fetches watch history for the admin session (will only show admin's own -- so show a note). Better approach: add a total watch time summary per user by storing watch time in localStorage keyed by phone, updated each time a user watches. Display from localStorage in admin.
   - Simpler approach: track total watch seconds in localStorage per phone on every `recordWatchProgress` call; admin reads all localStorage watch keys to show per-user totals. This works without a backend change.
4. **Frontend: Watch time tracking** -- in VideoPlayerPage/VideosPage wherever `recordWatchProgress` is called, also update localStorage `watchTime_<phone>` += watchedSeconds.
5. **Frontend validation** -- typecheck, lint, build.
