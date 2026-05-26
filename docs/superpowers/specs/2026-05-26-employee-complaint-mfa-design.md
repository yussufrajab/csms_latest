# Design Spec: Magic Link MFA for Complaint Submission

**Date:** 2026-05-26
**Status:** Approved

## Overview

Employees (who login with zanid/payroll/zssf numbers) must verify their identity via email magic link before submitting complaints. This ensures only the legitimate employee can file complaints using their government/academic email.

## Flow

1. Employee fills complaint form and clicks "Wasilisha Lalamiko"
2. System validates:
   - Email exists on profile
   - Email ends with `.go.tz` or `.ac.tz`
3. System generates magic link with encoded complaint data and sends to email
4. Employee sees confirmation: "Barua pepe imetumwa. Bonyeza kiungo katika email yako kuwasilisha lalamiko."
5. Employee opens email, clicks magic link
6. App validates token, creates complaint, shows success page
7. Employee can return to complaints page to see their submission

## Components

### Frontend Changes

#### `src/app/dashboard/complaints/page.tsx`

**Changes:**
- Remove MFA modal state variables (`isMfaModalOpen`, `mfaEmail`, `mfaPendingData`)
- Remove `MfaVerifyForm` import
- Simplify `onEmployeeSubmit`:
  1. Validate email exists and has valid domain
  2. Store form data in sessionStorage (for retrieval after magic link click)
  3. Call `/api/complaints/mfa-initiate` with complaint data
  4. Show success toast: "Barua pepe imetumwa. Bonyeza kiungo katika email yako kuwasilisha lalamiko."
  5. Reset form, show "waiting for confirmation" state

- Remove `handleInitiateMfa` function
- Remove `handleMfaVerified` function
- Add `submitWithMagicLink` function that handles the initiate flow
- Add `isWaitingForConfirmation` state to show appropriate UI

**New UI State:**
- After clicking submit: Show card with email icon, message about checking email, and "Sasisha" refresh button
- Add visual indicator that submission is pending email verification

### Magic Link Handler Page

#### `src/app/mfa/magic-link-confirm/page.tsx`

**Purpose:** Handle magic link clicks from complaint submission emails.

**URL Pattern:** `/mfa/magic-link-confirm?token=XXX&action=complaint`

**Flow:**
1. Extract token and action from URL
2. If action !== 'complaint', redirect to home with error
3. Call `/api/complaints/magic-link-verify` with token
4. On success:
   - Show success message: "Lalamiko lako limewasilishwa kwa mafanikio!"
   - Store success state in sessionStorage
   - Redirect to `/dashboard/complaints` after 3 seconds
5. On error:
   - Show error message
   - Provide "Try Again" button linking to `/dashboard/complaints`

**States:**
- Loading: Show spinner
- Success: Green checkmark, success message
- Error: Red X, error message, retry button

### Backend Changes

#### `src/app/api/complaints/mfa-initiate/route.ts`

**Already exists** - needs verification that it properly:
- Validates user role is EMPLOYEE
- Validates email exists with valid domain
- Creates OTP and magic link tokens
- Sends email with magic link containing complaint data

#### New: `src/app/api/complaints/magic-link-verify/route.ts`

**Purpose:** Validate magic link token and create complaint.

**Logic:**
1. Find MfaToken by token value
2. Validate token is MAGIC_LINK type
3. Validate token is not expired
4. Validate token has not been used
5. Extract complaint data from token metadata
6. Mark token as used
7. Create complaint in database
8. Create notifications for DO/HHRMD/HRMO
9. Return success

**Schema:** Same as `mfa-verify/route.ts` but for magic links.

### Email Template Updates

#### `src/lib/email.ts`

**Changes:**
- Create `sendComplaintMagicLinkEmail` function or update `sendMfaEmail` to accept a complaint context parameter
- Template should include:
  - Subject: "Thibitisha Kuwasilisha Lalamiko - CSMS"
  - Greeting with employee name
  - Clear instruction: "Bonyeza kiungo hapa chini kuwasilisha lalamiko lako"
  - Large, prominent magic link button
  - Expiry notice (15 minutes)
  - If complaint data available: Show complaint subject/timestamp
  - Security notice: "Kiungo hiki kinaisha baada ya dakika 15 na kinaweza kutumika mara moja tu."

## Data Flow

```
[Complaints Page]
    |
    v
onEmployeeSubmit() validates email
    |
    v
sessionStorage.setItem('pendingComplaint', JSON.stringify(formData))
    |
    v
POST /api/complaints/mfa-initiate
    |
    v
[Email sent to employee]
    |
    v
[Employee clicks magic link]
    |
    v
/mfa/magic-link-confirm?token=XXX&action=complaint
    |
    v
POST /api/complaints/magic-link-verify
    |
    v
[Create complaint, send notifications]
    |
    v
[Show success page]
    |
    v
[Redirect to /dashboard/complaints]
```

## Session Storage Strategy

Store form data in sessionStorage before sending magic link:
- Key: `pendingComplaint`
- Value: JSON stringified complaint form data
- Use as fallback if magic link fails to parse complaint data

## Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| No email on profile | "Barua pepe ya serikali inahitajika. Ongeza email yako kwenye ukurufu wako." | Link to profile |
| Invalid email domain | "Email lazima iwe na domain ya .go.tz au .ac.tz" | Link to profile edit |
| Token expired | "Kiungo kilikuwa kimekalify. Wasilisha lalamiko tena." | Link to complaints page |
| Token already used | "Hii ombi tayari limetumwa. Angalia malalamiko yako." | Link to complaints page |
| Invalid token | "Kiungo kisicho sahihi. Wasilisha lalamiko tena." | Link to complaints page |

## File Checklist

- [x] `src/app/dashboard/complaints/page.tsx` - Frontend changes
- [x] `src/app/mfa/magic-link-confirm/page.tsx` - Magic link handler (NEW)
- [x] `src/app/api/complaints/magic-link-verify/route.ts` - Backend verification (NEW)
- [x] `src/lib/email.ts` - Email template update
- [x] `src/app/api/complaints/mfa-initiate/route.ts` - Verify existing implementation