# Tm11primeTime

## Current State
- LandingPage redirects any authenticated user straight to `/dashboard`.
- RegisterPage starts at the "form" step every time it loads; there is no logic to detect a returning user who has already registered but not paid.
- Payment page (`/register`) is accessible from the sidebar as a static menu link.

## Requested Changes (Diff)

### Add
- After login, if the user is already registered (`getCallerUserProfile()` returns a profile) but has `isPaid = false` (no approved payment), automatically redirect them to `/register` and pre-skip to the **payment step** instead of showing the registration form again.
- In `RegisterPage`, on mount while identity is present, call `getCallerUserProfile()`. If a profile already exists (user is registered), jump directly to the "payment" step so they can complete the UPI payment -- bypassing the registration form.

### Modify
- `LandingPage.tsx`: change the redirect-on-authenticated logic so it checks whether the user profile has `isPaid` set. If not paid, send to `/register`; if paid (or profile fetch fails), send to `/dashboard`.
- `RegisterPage.tsx`: add a `useEffect` that fires when identity becomes available -- fetches the caller profile, and if a profile already exists, transitions the step state to `"payment"` automatically.

### Remove
- Nothing removed.

## Implementation Plan
1. In `RegisterPage.tsx`, import `useCallerUserProfile` (or call the actor directly via `useActor`) to detect existing registration on load.
2. Add a `useEffect` in `RegisterPage` watching `identity` + actor readiness: if `getCallerUserProfile()` returns a non-null profile and step is still "form", set step to "payment" and pre-fill the utrForm name/phone from the existing profile.
3. In `LandingPage.tsx`, import `useCallerUserProfile` and after identity is available, check the profile's `isPaid` field. Redirect to `/register` if not paid, `/dashboard` if paid.
4. Add a loading indicator in LandingPage while the profile check is in flight (avoid flash of content).
