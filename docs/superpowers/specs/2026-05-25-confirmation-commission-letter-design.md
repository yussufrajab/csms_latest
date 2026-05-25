# Confirmation Module: Commission Official Letter Attachment

**Date**: 2026-05-25
**Status**: Approved

## Summary

When commission users (HHRMD, DO, HRMO) approve or reject a confirmation request, they must attach an official commission letter. This letter will be visible to the HRO and HRRP of that institution.

## Requirements

- Commission letter is **required** for both approval and rejection decisions
- Letter must be uploaded at the same time as the decision (cannot submit decision without letter)
- Only HRO and HRRP of the specific institution can view/download the commission letter
- PDF only, max 1MB
- Existing commission decisions (already made) are unaffected

## Data Model

### Schema Change

Add to `ConfirmationRequest` model:

```prisma
commissionLetterKey String?   // MinIO object key for the commission letter
```

Migration: `npx prisma db push`

The field is nullable so that:
- Requests still under review have no commission letter (expected)
- Historical commission decisions (made before this feature) remain valid

### Storage

- MinIO folder: `confirmation/commission-letters`
- Key pattern: `confirmation/commission-letters/{timestamp}_{randomSuffix}_{sanitizedFilename}` (follows existing MinIO upload pattern)
- No changes needed to MinIO configuration or bucket setup

## Backend

### File Upload

Reuse existing `POST /api/files/upload` endpoint:
- Frontend uploads file with `folder: 'confirmation/commission-letters'`
- Backend returns `{ objectKey, originalName, size, contentType }`
- No new upload API needed

### Decision API (`/api/confirmations` PATCH)

Changes to the commission decision handling:

1. Request body now includes `commissionLetterKey` (the MinIO object key from the file upload)
2. Backend validates: if the decision is a commission approval or rejection, `commissionLetterKey` is required — return 400 if missing
3. Save `commissionLetterKey` on the `ConfirmationRequest` record alongside `status`, `commissionDecisionDate`, `reviewedById`

### File Download/Preview

Existing routes work without changes:
- `GET /api/files/download/[...objectKey]` — attachment download
- `GET /api/files/preview/[...objectKey]` — inline preview

Auth for file access is handled by the existing `withAuth` middleware on these routes. HRO and HRRP users are already authenticated and can access any file by object key.

## Frontend

### Commission Decision Dialog

When HHRMD/DO/HRMO clicks "Approved by Commission" or "Rejected by Commission":

1. Dialog opens (existing dialog pattern, or new if not currently using one)
2. Dialog contains:
   - Rejection reason text (if rejecting) — already exists
   - **New**: File upload field using the existing `FileUpload` component
     - Label: "Barua Rasmi ya Tume" (Official Commission Letter)
     - Accept: `.pdf` only
     - Max size: 1MB
     - Required: submit button is disabled until file is uploaded
3. On submit:
   - Upload file via `POST /api/files/upload` with `folder: 'confirmation/commission-letters'`
   - If upload fails, show error toast, keep dialog open for retry
   - If upload succeeds, send PATCH to `/api/confirmations` with `commissionLetterKey` included

### Details Modal

In the request details modal, add a "Barua Rasmi ya Tume" section:

- Visible to all roles when `commissionLetterKey` is populated
- Shows the commission letter with Preview and Download buttons (same pattern as existing document rows)
- Positioned after the existing submission documents section, clearly labeled as a separate category
- HRO/HRRP see this when viewing a request that has been decided by commission

## Error Handling

| Scenario | Handling |
|----------|----------|
| File upload fails | Error toast, dialog stays open for retry |
| Submit without letter | Frontend: submit button disabled. Backend: 400 error |
| File too large | Enforced by `FileUpload` maxSize prop + backend validation |
| Non-PDF file | Enforced by `accept=".pdf"` + backend content-type check |
| Old requests without letter | `commissionLetterKey` is nullable, letter section simply not shown |

## Files to Modify

1. `prisma/schema.prisma` — add `commissionLetterKey` field
2. `src/app/api/confirmations/route.ts` — validate and save `commissionLetterKey` on commission decisions
3. `src/app/dashboard/confirmation/page.tsx` — add file upload to commission decision, add letter display in details modal