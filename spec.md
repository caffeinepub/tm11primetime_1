# Tm11primeTime

## Current State
- Registration flow has 3 steps: form, payment, success
- Payment step shows UPI ID to copy, deep-link buttons for PhonePe/GPay/BHIM, and an "I have Paid" button
- Tapping "I have Paid" immediately calls `completePayment` on the backend and moves to success step
- No transaction verification details are collected from the user

## Requested Changes (Diff)

### Add
- A payment submission sub-form on the payment step, shown after user taps "I have Paid"
- Fields: Transaction ID / UTR Number, Full Name (pre-filled from registration), Phone Number (pre-filled from registration)
- A "Confirm Payment" button that submits this info alongside `completePayment`
- Display of submitted UTR/name/phone in the admin panel so admin can verify

### Modify
- Replace the direct `completePayment` call on "I have Paid" button with showing an inline form for UTR/transaction ID submission
- After user fills the form and confirms, then call `completePayment` and proceed to success
- Admin user list or transaction list should show the submitted UTR info for each user

### Remove
- Nothing removed

## Implementation Plan
1. Add state fields in RegisterPage for: `utrForm` (txId, userName, phone), `showUtrForm` boolean
2. "I have Paid" button sets `showUtrForm = true` instead of directly calling `completePayment`
3. Render a new inline card/panel with three inputs: Transaction ID / UTR Number, User Name (pre-filled), Phone Number (pre-filled)
4. "Confirm Payment" button validates inputs and calls `completePayment`, then navigates to success
5. Store UTR info client-side (localStorage or state) and display in admin panel if backend has no dedicated field
6. Admin panel: show UTR / transaction submission note in the user row details
