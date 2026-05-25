# HRRP Review Stage Design

## Summary

Add an HRRP (Human Resource Responsible Personnel) review stage between HRO submission and commission review for all request types. HRO will no longer send requests directly to the commission — instead, HRRP reviews, approves/forwards, or rejects/returns before the request reaches the commission (HHRMD/HRMO/DO). This is implemented first for the confirmation module, then extended to other request types.

## Motivation

Currently, HRO submits confirmation requests directly to the commission (HHRMD/HRMO). The requirement is that all communication between institutions and the commission must go through HRRP. HRRP acts as the institutional gatekeeper, reviewing requests before they reach the commission.

## Design Decisions

- **Approach A chosen**: New `hrrp_review` reviewStage value inserted between `initial` and `commission_review`.
- HRRP can both approve (forward to commission) and reject (return to HRO with reason).
- HRRP can still create their own requests, which auto-skip HRRP review and go directly to commission review.
- When HRRP rejects, the request goes back to HRO for correction (resubmission loop).
- Implementation is confirmation-first, then extended to other modules incrementally.

## Data Model

### New ConfirmationRequest fields

```prisma
model ConfirmationRequest {
  // ... existing fields ...
  hrrpReviewedById   String?   // FK to User who reviewed at HRRP stage
  hrrpReviewedBy     User?     @relation("ConfirmationRequest_hrrpReviewedByToUser", fields: [hrrpReviewedById], references: [id])
  hrrpReviewedAt     DateTime? // When HRRP reviewed
}
```

### reviewStage values

| Value | Meaning |
|---|---|
| `initial` | Request awaiting HRRP review (new meaning — was "awaiting commission review") |
| `hrrp_review` | **NEW** — HRRP has approved, request is pending commission review |
| `commission_review` | Commission (HHRMD/HRMO) is reviewing |
| `completed` | Commission has made a final decision |

### Status strings

| Status | reviewStage | Who sets it | When |
|---|---|---|---|
| `"Pending HRRP Review"` | `initial` | HRO (on submit) | HRO submits a new request |
| `"Approved by HRRP - Awaiting Commission Review"` | `hrrp_review` | HRRP (approves) | HRRP approves and forwards |
| `"Rejected by HRRP - Awaiting HRO Correction"` | `initial` | HRRP (rejects) | HRRP rejects, sends back to HRO |
| `"Pending HRMO/HHRMD Review"` | `hrrp_review` | — | Legacy only — pre-existing requests |
| `"Approved by HRMO - Awaiting Commission Decision"` | `commission_review` | HRMO | HRMO approves (unchanged) |
| `"Approved by HHRMD - Awaiting Commission Decision"` | `commission_review` | HHRMD | HHRMD approves (unchanged) |
| `"Rejected by HRMO - Awaiting HRO Correction"` | `initial` | HRMO | HRMO rejects (unchanged) |
| `"Rejected by HHRMD - Awaiting HRO Correction"` | `initial` | HHRMD | HHRMD rejects (unchanged) |
| `"Approved by Commission"` | `completed` | HHRMD/HRMO | Commission approves (unchanged) |
| `"Rejected by Commission - Request Concluded"` | `completed` | HHRMD/HRMO | Commission rejects (unchanged) |

### Workflow diagram

```
[HRO submits] → "Pending HRRP Review" (reviewStage: "initial")
                      |
               [HRRP reviews]
                      |
            +---------+---------+
            |                   |
       HRRP APPROVES        HRRP REJECTS
            |                   |
            v                   v
 "Approved by HRRP -       "Rejected by HRRP -
  Awaiting Commission       Awaiting HRO Correction"
  Review"                   (reviewStage: "initial")
 (reviewStage:            HRO corrects & resubmits
  "hrrp_review")            → back to "Pending HRRP Review"
            |
    [Commission reviews]
    (HHRMD/HRMO as before)
            |
    ...existing commission
    workflow unchanged...
```

**HRRP self-submission**: When HRRP creates a request, it auto-approves to `"Approved by HRRP - Awaiting Commission Review"` with `reviewStage: "hrrp_review"`.

## Role-Based Changes

### Frontend (confirmation page)

**HRO:**
- Submit form (unchanged)
- "Correct & Resubmit" button now shows for `"Rejected by HRRP - Awaiting HRO Correction"`
- No commission review actions

**HRRP:**
- Submit form (unchanged — own requests auto-approve)
- **NEW**: "Verify & Forward to Commission" button on `"Pending HRRP Review"` requests
- **NEW**: "Reject & Return to HRO" button on `"Pending HRRP Review"` requests
- No commission review actions

**HHRMD/HRMO:**
- Commission review actions now on requests with `reviewStage: "hrrp_review"` instead of `"initial"`
- Otherwise unchanged

**CSCS:**
- View-only, unchanged

### Backend API

**POST `/api/confirmations` (create):**
- HRO: `status: "Pending HRRP Review"`, `reviewStage: "initial"`
- HRRP: `status: "Approved by HRRP - Awaiting Commission Review"`, `reviewStage: "hrrp_review"`, `hrrpReviewedById: user.id`, `hrrpReviewedAt: now`

**PATCH `/api/confirmations` (update):**
- HRRP approve: `status: "Approved by HRRP - Awaiting Commission Review"`, `reviewStage: "hrrp_review"`, `hrrpReviewedById`, `hrrpReviewedAt`
- HRRP reject: `status: "Rejected by HRRP - Awaiting HRO Correction"`, `reviewStage: "initial"`, `rejectionReason`
- HRO resubmit: `status: "Pending HRRP Review"`, `reviewStage: "initial"`, clear `rejectionReason`
- **Important**: When commission rejects a request back to HRO (e.g. `"Rejected by HRMO - Awaiting HRO Correction"`), the HRO resubmission goes back to HRRP first, NOT directly to commission. All HRO resubmissions always go through HRRP.
- HHRMD/HRMO actions: Unchanged, but operate on `reviewStage: "hrrp_review"` requests

### Notifications

- HRO submission → Notify HRRP at the same institution
- HRRP approval → Notify HHRMD and HRMO (request enters commission review)
- HRRP rejection → Notify the HRO who submitted
- Commission decisions → Unchanged

## Backward Compatibility

- Existing requests with status `"Pending HRMO/HHRMD Review"` and `reviewStage: "initial"` are **legacy** — still processed by HHRMD/HRMO as before.
- New code must handle both old and new status strings for `reviewStage: "initial"`.
- For legacy requests still at `"Pending HRMO/HHRMD Review"`, HHRMD/HRMO must still be able to review them using the old status checks. The frontend and API must support both old and new status strings during the transition period.
- No data migration needed for existing records — they continue through the old path.

## Extensibility to Other Modules

The same pattern applies to all request types (Promotion, LWOP, CadreChange, Retirement, etc.):
1. Add `hrrp_review` reviewStage
2. Add `hrrpReviewedById` and `hrrpReviewedAt` fields
3. Update status strings
4. Update frontend to show HRRP review actions
5. Update API authorization logic

Confirmation module is the reference implementation. Other modules follow the same pattern.