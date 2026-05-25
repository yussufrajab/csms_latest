# HRRP Review Stage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an HRRP review stage between HRO submission and commission review in the confirmation module, so HRO requests go through HRRP approval before reaching the commission.

**Architecture:** Insert a new `hrrp_review` reviewStage between `initial` and `commission_review`. HRO submissions start at `"Pending HRRP Review"` (reviewStage `initial`). HRRP approves → `"Approved by HRRP - Awaiting Commission Review"` (reviewStage `hrrp_review`). HRRP rejects → `"Rejected by HRRP - Awaiting HRO Correction"` (reviewStage `initial`). Commission (HHRMD/HRMO) then reviews from `hrrp_review` stage. HRRP self-submissions auto-approve to `hrrp_review`.

**Tech Stack:** Next.js 14, Prisma, TypeScript, React, Tailwind CSS

---

### Task 1: Add HRRP review fields to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma:62-83` (ConfirmationRequest model)

- [ ] **Step 1: Add `hrrpReviewedById` and `hrrpReviewedAt` fields to ConfirmationRequest model**

In `prisma/schema.prisma`, add two new fields inside the `ConfirmationRequest` model (after the `commissionDecisionDate` field, before `createdAt`):

```prisma
  hrrpReviewedById                                  String?
  hrrpReviewedAt                                   DateTime?
```

And add the relation near the other User relations (after `User_ConfirmationRequest_submittedByIdToUser`):

```prisma
  User_ConfirmationRequest_hrrpReviewedByToUser     User?     @relation("ConfirmationRequest_hrrpReviewedByToUser", fields: [hrrpReviewedById], references: [id])
```

Also add an index on `hrrpReviewedById`:

```prisma
  @@index([hrrpReviewedById])
```

The full model should look like:

```prisma
model ConfirmationRequest {
  id                                           String    @id
  status                                       String
  reviewStage                                  String
  documents                                    String[]
  rejectionReason                              String?
  employeeId                                   String
  submittedById                                String
  reviewedById                                 String?
  decisionDate                                 DateTime?
  commissionDecisionDate                       DateTime?
  hrrpReviewedById                             String?
  hrrpReviewedAt                               DateTime?
  createdAt                                    DateTime  @default(now())
  updatedAt                                    DateTime
  Employee                                     Employee  @relation(fields: [employeeId], references: [id])
  User_ConfirmationRequest_reviewedByIdToUser  User?     @relation("ConfirmationRequest_reviewedByIdToUser", fields: [reviewedById], references: [id])
  User_ConfirmationRequest_submittedByIdToUser User      @relation("ConfirmationRequest_submittedByIdToUser", fields: [submittedById], references: [id])
  User_ConfirmationRequest_hrrpReviewedByToUser User?     @relation("ConfirmationRequest_hrrpReviewedByToUser", fields: [hrrpReviewedById], references: [id])

  @@index([status])
  @@index([reviewStage])
  @@index([employeeId])
  @@index([createdAt(sort: Desc)])
  @@index([hrrpReviewedById])
}
```

- [ ] **Step 2: Generate Prisma migration**

Run:
```bash
npx prisma migrate dev --name add_hrrp_review_fields
```

Expected: Migration created successfully, schema applied to database.

- [ ] **Step 3: Run typecheck to verify schema changes compile**

Run:
```bash
npm run typecheck
```

Expected: No type errors related to the new fields.

- [ ] **Step 4: Commit schema changes**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add hrrpReviewedById and hrrpReviewedAt fields to ConfirmationRequest"
```

---

### Task 2: Update the confirmation API POST handler for HRRP-aware submission

**Files:**
- Modify: `src/app/api/confirmations/route.ts:151-318` (POST handler)

- [ ] **Step 1: Update POST handler to set different initial status based on role**

In `src/app/api/confirmations/route.ts`, in the POST handler, change the status and reviewStage logic after line 212 (the `db.confirmationRequest.create` call). The current code sets:

```typescript
status: body.status || 'Pending',
reviewStage: body.reviewStage || 'initial',
```

Replace with role-based logic:

```typescript
const isHRRP = body.userRole === 'HRRP';
const initialStatus = isHRRP
  ? 'Approved by HRRP - Awaiting Commission Review'
  : 'Pending HRRP Review';
const initialReviewStage = isHRRP ? 'hrrp_review' : 'initial';
const hrrpData = isHRRP
  ? {
      hrrpReviewedById: body.submittedById,
      hrrpReviewedAt: new Date(),
    }
  : {};

const confirmationRequest = await db.confirmationRequest.create({
  data: {
    id: uuidv4(),
    employeeId: body.employeeId,
    submittedById: body.submittedById,
    status: initialStatus,
    reviewStage: initialReviewStage,
    documents: body.documents || [],
    updatedAt: new Date(),
    ...hrrpData,
  },
  include: {
    Employee: {
      select: {
        id: true,
        name: true,
        zanId: true,
        payrollNumber: true,
        zssfNumber: true,
        department: true,
        cadre: true,
        status: true,
        dateOfBirth: true,
        employmentDate: true,
        Institution: { select: { id: true, name: true } },
      },
    },
    User_ConfirmationRequest_submittedByIdToUser: {
      select: { id: true, name: true, username: true },
    },
    User_ConfirmationRequest_hrrpReviewedByToUser: isHRRP
      ? { select: { id: true, name: true, username: true } }
      : false,
  },
});
```

- [ ] **Step 2: Update notifications in POST handler to target HRRP instead of commission for HRO submissions**

After the `db.confirmationRequest.create` call, find the notification block (around lines 247-276). Replace the existing notification logic:

```typescript
// Create notification for CSC reviewers
const notification = NotificationTemplates.confirmationSubmitted(
  confirmationRequest.Employee.name,
  confirmationRequest.id
);

await createNotificationForRole(
  ROLES.HHRMD || 'HHRMD',
  notification.message,
  notification.link
);
await createNotificationForRole(
  ROLES.HRMO || 'HRMO',
  notification.message,
  notification.link
);
await createNotificationForRole(
  ROLES.DO || 'DO',
  notification.message,
  notification.link
);
```

Replace with role-aware notification logic:

```typescript
// Create notification - target depends on who submitted
if (isHRRP) {
  // HRRP submitted directly: notify commission (HHRMD/HRMO)
  const notification = NotificationTemplates.confirmationSubmitted(
    confirmationRequest.Employee.name,
    confirmationRequest.id
  );
  await createNotificationForRole(ROLES.HHRMD, notification.message, notification.link);
  await createNotificationForRole(ROLES.HRMO, notification.message, notification.link);
  // DO is not involved in confirmation workflow - removed per design
} else {
  // HRO submitted: notify HRRP at the same institution
  const notification = NotificationTemplates.confirmationSubmitted(
    confirmationRequest.Employee.name,
    confirmationRequest.id
  );
  // Find HRRP users at the same institution
  const employee = await db.employee.findUnique({
    where: { id: body.employeeId },
    select: { institutionId: true },
  });
  if (employee?.institutionId) {
    const hrrpUsers = await db.user.findMany({
      where: { role: ROLES.HRRP, active: true, institutionId: employee.institutionId },
      select: { id: true },
    });
    for (const hrrpUser of hrrpUsers) {
      await createNotification({
        message: notification.message,
        link: notification.link,
        userId: hrrpUser.id,
      });
    }
  }
}
```

- [ ] **Step 3: Verify the POST handler changes compile**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 4: Commit POST handler changes**

```bash
git add src/app/api/confirmations/route.ts
git commit -m "feat: update confirmation POST to route HRO submissions through HRRP"
```

---

### Task 3: Update the confirmation API PATCH handler for HRRP review actions

**Files:**
- Modify: `src/app/api/confirmations/route.ts:321-530` (PATCH handler)

- [ ] **Step 1: Add HRRP authorization and action handling to PATCH handler**

The current PATCH handler has two action types: `isApprovalOrRejection` (HHRMD/HRMO) and `isResubmission` (HRO/HRRP). Add HRRP-specific actions. Replace the authorization block (around lines 339-370) with:

```typescript
// Authorization: Different roles can perform different update actions
const isHrrpApproval =
  updateData.status === 'Approved by HRRP - Awaiting Commission Review' &&
  !updateData.reviewedById;
const isHrrpRejection =
  updateData.status === 'Rejected by HRRP - Awaiting HRO Correction';
const isHrrpAction = isHrrpApproval || isHrrpRejection;
const isCommissionApprovalOrRejection = updateData.reviewedById !== undefined && !isHrrpAction;
const isCommissionAction =
  (updateData.status?.includes('Approved by HRMO') ||
   updateData.status?.includes('Approved by HHRMD') ||
   updateData.status?.includes('Rejected by HRMO') ||
   updateData.status?.includes('Rejected by HHRMD') ||
   updateData.status?.includes('Approved by Commission') ||
   updateData.status?.includes('Rejected by Commission')) &&
  updateData.reviewedById !== undefined;
const isResubmission =
  updateData.status === 'Pending HRRP Review' &&
  !updateData.reviewedById;

let authCheck;
if (isHrrpAction) {
  // HRRP approve/reject action - only HRRP role
  authCheck = checkRoleAuthorization(userRole, ['HRRP' as const]);
} else if (isCommissionApprovalOrRejection) {
  // Commission approval/rejection - only HHRMD/HRMO
  authCheck = checkRoleAuthorization(userRole, ['HHRMD' as const, 'HRMO' as const]);
} else if (isResubmission) {
  // HRO resubmit after rejection - HRO and HRRP
  authCheck = checkRoleAuthorization(userRole, ['HRO' as const, 'HRRP' as const]);
} else {
  authCheck = { authorized: false, message: 'Invalid update action' };
}
```

- [ ] **Step 2: Add HRRP-specific data fields in PATCH handler**

After the authorization check passes and before the `db.confirmationRequest.update` call, add HRRP field handling. Find the line:

```typescript
const updatedRequest = await db.confirmationRequest.update({
  where: { id },
  data: updateData,
```

Add HRRP review fields to `updateData` before the update call:

```typescript
// Add HRRP review fields if this is an HRRP action
if (isHrrpApproval) {
  updateData.hrrpReviewedById = updateData.hrrpReviewedById || user?.id;
  updateData.hrrpReviewedAt = new Date().toISOString();
  updateData.reviewStage = 'hrrp_review';
}
if (isHrrpRejection) {
  updateData.reviewStage = 'initial';
}
```

Also update the include block in the update query to add the new relation:

```typescript
const updatedRequest = await db.confirmationRequest.update({
  where: { id },
  data: updateData,
  include: {
    Employee: {
      select: {
        id: true,
        name: true,
        zanId: true,
        payrollNumber: true,
        zssfNumber: true,
        department: true,
        cadre: true,
        status: true,
        dateOfBirth: true,
        employmentDate: true,
        Institution: { select: { id: true, name: true } },
      },
    },
    User_ConfirmationRequest_submittedByIdToUser: {
      select: { id: true, name: true, username: true },
    },
    User_ConfirmationRequest_reviewedByIdToUser: {
      select: { id: true, name: true, username: true },
    },
    User_ConfirmationRequest_hrrpReviewedByToUser: {
      select: { id: true, name: true, username: true },
    },
  },
});
```

- [ ] **Step 3: Add HRRP notification logic to PATCH handler**

After the existing commission approval/rejection notification block (around line 487), add HRRP-specific notifications. Find the block that sends email notifications and add before it:

```typescript
// HRRP approval notifications: notify commission (HHRMD/HRMO) that a request is ready for review
if (isHrrpApproval) {
  const hrrpNotification = NotificationTemplates.confirmationSubmitted(
    updatedRequest.Employee?.name || 'Unknown',
    id
  );
  await createNotificationForRole(ROLES.HHRMD, hrrpNotification.message, hrrpNotification.link);
  await createNotificationForRole(ROLES.HRMO, hrrpNotification.message, hrrpNotification.link);

  await sendRequestSubmissionEmails({
    requestType: 'Confirmation',
    employeeName: updatedRequest.Employee?.name || 'Unknown',
    requestId: id,
    submittedByName: updatedRequest.User_ConfirmationRequest_submittedByIdToUser?.name || 'Unknown',
    dashboardPath: '/dashboard/confirmation',
  });
}

// HRRP rejection: notify the HRO who submitted
if (isHrrpRejection) {
  const rejectionNotification = NotificationTemplates.confirmationRejected(
    id,
    updateData.rejectionReason || 'No reason provided'
  );
  await createNotification({
    message: rejectionNotification.message,
    link: rejectionNotification.link,
    userId: updatedRequest.submittedById,
  });
}
```

- [ ] **Step 4: Update the data transform in PATCH handler to include hrrpReviewedBy**

Find the transform block near line 504-513 and add the hrrpReviewedBy field:

```typescript
const transformedRequest = {
  ...updatedRequest,
  submittedBy: (updatedRequest as any)
    .User_ConfirmationRequest_submittedByIdToUser,
  reviewedBy: (updatedRequest as any)
    .User_ConfirmationRequest_reviewedByIdToUser,
  hrrpReviewedBy: (updatedRequest as any)
    .User_ConfirmationRequest_hrrpReviewedByToUser,
  User_ConfirmationRequest_submittedByIdToUser: undefined,
  User_ConfirmationRequest_reviewedByIdToUser: undefined,
  User_ConfirmationRequest_hrrpReviewedByToUser: undefined,
};
```

- [ ] **Step 5: Verify PATCH handler changes compile**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 6: Commit PATCH handler changes**

```bash
git add src/app/api/confirmations/route.ts
git commit -m "feat: add HRRP review actions to confirmation PATCH handler"
```

---

### Task 4: Update GET handler to include hrrpReviewedBy and handle legacy statuses

**Files:**
- Modify: `src/app/api/confirmations/route.ts:39-149` (GET handler)

- [ ] **Step 1: Add hrrpReviewedBy to GET include and transform**

In the GET handler's `findMany` call (around line 92-121), add the hrrpReviewedBy relation to the include:

```typescript
include: {
  Employee: {
    select: {
      id: true,
      name: true,
      zanId: true,
      payrollNumber: true,
      zssfNumber: true,
      department: true,
      cadre: true,
      status: true,
      dateOfBirth: true,
      employmentDate: true,
      Institution: { select: { id: true, name: true } },
    },
  },
  User_ConfirmationRequest_submittedByIdToUser: {
    select: { id: true, name: true, username: true },
  },
  User_ConfirmationRequest_reviewedByIdToUser: {
    select: { id: true, name: true, username: true },
  },
  User_ConfirmationRequest_hrrpReviewedByToUser: {
    select: { id: true, name: true, username: true },
  },
},
```

And update the transform block (around line 125-131):

```typescript
const transformedRequests = requests.map((req: any) => ({
  ...req,
  submittedBy: req.User_ConfirmationRequest_submittedByIdToUser,
  reviewedBy: req.User_ConfirmationRequest_reviewedByIdToUser,
  hrrpReviewedBy: req.User_ConfirmationRequest_hrrpReviewedByToUser,
  User_ConfirmationRequest_submittedByIdToUser: undefined,
  User_ConfirmationRequest_reviewedByIdToUser: undefined,
  User_ConfirmationRequest_hrrpReviewedByToUser: undefined,
}));
```

- [ ] **Step 2: Verify GET handler changes compile**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 3: Commit GET handler changes**

```bash
git add src/app/api/confirmations/route.ts
git commit -m "feat: add hrrpReviewedBy to confirmation GET response"
```

---

### Task 5: Update frontend ConfirmationRequest interface and status handling

**Files:**
- Modify: `src/app/dashboard/confirmation/page.tsx:48-62` (interface)
- Modify: `src/app/dashboard/confirmation/page.tsx:296-303` (pendingStatuses)
- Modify: `src/app/dashboard/confirmation/page.tsx:429-436` (handleSubmitRequest)
- Modify: `src/app/dashboard/confirmation/page.tsx:622-665` (handleConfirmResubmit)

- [ ] **Step 1: Add hrrpReviewedBy to ConfirmationRequest interface**

In the `ConfirmationRequest` interface (around line 48-62), add the new field:

```typescript
interface ConfirmationRequest {
  id: string;
  Employee?: Partial<Employee & User & { Institution: { name: string } }>;
  employee?: Partial<Employee & User & { institution: { name: string } }>;
  submittedBy: Partial<User>;
  submittedById?: string;
  reviewedBy?: Partial<User> | null;
  hrrpReviewedBy?: Partial<User> | null;
  status: string;
  reviewStage: string;
  documents: string[];
  rejectionReason?: string | null;
  createdAt: string;
  decisionDate?: string | null;
  commissionDecisionDate?: string | null;
  hrrpReviewedAt?: string | null;
}
```

- [ ] **Step 2: Update pendingStatuses array to include new HRRP statuses**

Find the `pendingStatuses` array (around line 296-303):

```typescript
const pendingStatuses = [
  'Pending HRMO/HHRMD Review',
  'Pending DO/HHRMD Review',
  'Request Received – Awaiting Commission Decision',
];
```

Replace with:

```typescript
const pendingStatuses = [
  'Pending HRRP Review',
  'Pending HRMO/HHRMD Review',
  'Approved by HRRP - Awaiting Commission Review',
  'Pending DO/HHRMD Review',
  'Request Received – Awaiting Commission Decision',
];
```

- [ ] **Step 3: Update handleSubmitRequest to use HRRP-aware status**

Find the `handleSubmitRequest` function payload (around line 429-436):

```typescript
const payload = {
  employeeId: employeeToConfirm.id,
  submittedById: user.id,
  userRole: role,
  documents: documentsList,
  status: 'Pending HRMO/HHRMD Review',
  reviewStage: 'initial',
};
```

Replace with:

```typescript
const payload = {
  employeeId: employeeToConfirm.id,
  submittedById: user.id,
  userRole: role,
  documents: documentsList,
  // HRO submissions go to HRRP review first; HRRP submissions auto-approve
  status: role === ROLES.HRRP
    ? 'Approved by HRRP - Awaiting Commission Review'
    : 'Pending HRRP Review',
  reviewStage: role === ROLES.HRRP ? 'hrrp_review' : 'initial',
};
```

- [ ] **Step 4: Update handleConfirmResubmit to use new status**

Find the `handleConfirmResubmit` function (around line 597-683). There are two places where the old status is used:

1. The optimistic update (around line 622-629):

```typescript
const optimisticUpdate = pendingRequests.map((req) =>
  req.id === request.id
    ? {
        ...req,
        status: 'Pending HRMO/HHRMD Review',
        reviewStage: 'initial',
        rejectionReason: null,
        updatedAt: new Date().toISOString(),
      }
    : req
);
```

Replace with:

```typescript
const optimisticUpdate = pendingRequests.map((req) =>
  req.id === request.id
    ? {
        ...req,
        status: 'Pending HRRP Review',
        reviewStage: 'initial',
        rejectionReason: null,
        updatedAt: new Date().toISOString(),
      }
    : req
);
```

2. The toast message (around line 638-640):

```typescript
description: `Confirmation request for ${employeeData?.name || 'Employee'} has been corrected and resubmitted. Status: Pending HRMO/HHRMD Review`,
```

Replace with:

```typescript
description: `Confirmation request for ${employeeData?.name || 'Employee'} has been corrected and resubmitted. Status: Pending HRRP Review`,
```

3. The PATCH body (around line 653-665):

```typescript
body: JSON.stringify({
  id: request.id,
  userRole: role,
  status: 'Pending HRMO/HHRMD Review',
  reviewStage: 'initial',
  documents: [
    correctedEvaluationFormFile,
    correctedIpaCertificateFile,
    correctedLetterOfRequestFile,
  ].filter(Boolean),
  rejectionReason: null,
}),
```

Replace with:

```typescript
body: JSON.stringify({
  id: request.id,
  userRole: role,
  status: 'Pending HRRP Review',
  reviewStage: 'initial',
  documents: [
    correctedEvaluationFormFile,
    correctedIpaCertificateFile,
    correctedLetterOfRequestFile,
  ].filter(Boolean),
  rejectionReason: null,
}),
```

- [ ] **Step 5: Verify frontend changes compile**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 6: Commit frontend status/interface changes**

```bash
git add src/app/dashboard/confirmation/page.tsx
git commit -m "feat: update confirmation frontend to use HRRP review statuses"
```

---

### Task 6: Add HRRP review actions to frontend (approve/reject buttons and handlers)

**Files:**
- Modify: `src/app/dashboard/confirmation/page.tsx:517-543` (handleInitialAction)
- Modify: `src/app/dashboard/confirmation/page.tsx:546-565` (handleRejectionSubmit)
- Modify: `src/app/dashboard/confirmation/page.tsx:1162-1245` (action buttons rendering)

- [ ] **Step 1: Add handleHrrpAction handler function**

After the `handleRejectionSubmit` function (around line 565), add a new handler:

```typescript
const handleHrrpAction = async (
  requestId: string,
  action: 'forward' | 'reject'
) => {
  const request = pendingRequests.find((req) => req.id === requestId);
  if (!request) return;

  if (action === 'reject') {
    setCurrentRequestToAction(request);
    setRejectionReasonInput('');
    setIsRejectionModalOpen(true);
  } else if (action === 'forward') {
    // HRRP approves and forwards to commission
    const payload = {
      status: 'Approved by HRRP - Awaiting Commission Review',
      reviewStage: 'hrrp_review',
      hrrpReviewedById: user?.id,
      hrrpReviewedAt: new Date().toISOString(),
      decisionDate: new Date().toISOString(),
    };

    await handleUpdateRequest(
      requestId,
      payload,
      'Request approved by HRRP and forwarded to Commission'
    );
  }
};
```

- [ ] **Step 2: Update handleRejectionSubmit to support HRRP rejection**

Find the `handleRejectionSubmit` function (around line 546-565). The current code builds the rejection payload using `${role}`. This needs to differentiate between HRRP rejection and commission rejection. Replace the payload construction:

```typescript
const handleRejectionSubmit = async () => {
  if (!currentRequestToAction || !rejectionReasonInput.trim() || !user)
    return;

  let rejectionStatus: string;
  if (role === ROLES.HRRP) {
    rejectionStatus = 'Rejected by HRRP - Awaiting HRO Correction';
  } else {
    // HHRMD or HRMO commission rejection
    rejectionStatus = `Rejected by ${role} - Awaiting HRO Correction`;
  }

  const payload = {
    status: rejectionStatus,
    rejectionReason: rejectionReasonInput,
    reviewStage: role === ROLES.HRRP ? 'initial' : 'initial',
    decisionDate: new Date().toISOString(),
  };
  const success = await handleUpdateRequest(
    currentRequestToAction.id,
    payload,
    `Request rejected and returned to HRO`
  );
  if (success) {
    setIsRejectionModalOpen(false);
    setCurrentRequestToAction(null);
    setRejectionReasonInput('');
  }
};
```

- [ ] **Step 3: Add HRRP action buttons to the request card rendering**

Find the action buttons section (around line 1162-1245). Currently there are:
1. View Details button (always)
2. HRMO/HHRMD commission review actions (conditional)
3. HRO "Correct and Resubmit" button (conditional)

Add HRRP review actions between the View Details button and the commission actions. The full button block should be:

```tsx
<Button
  size="sm"
  variant="outline"
  onClick={() => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  }}
>
  View Details
</Button>
{/* HRRP Review Actions */}
{role === ROLES.HRRP && request.status === 'Pending HRRP Review' && (
  <>
    <Button
      size="sm"
      onClick={() => handleHrrpAction(request.id, 'forward')}
    >
      Verify &amp; Forward to Commission
    </Button>
    <Button
      size="sm"
      variant="destructive"
      onClick={() => handleHrrpAction(request.id, 'reject')}
    >
      Reject &amp; Return to HRO
    </Button>
  </>
)}
{/* HRMO/HHRMD Commission Review Actions */}
{(role === ROLES.HHRMD || role === ROLES.HRMO) && (
  <>
    {/* Commission initial review - for HRRP-approved requests */}
    {(role === ROLES.HRMO || role === ROLES.HHRMD) &&
      (request.status === 'Approved by HRRP - Awaiting Commission Review' ||
       request.status === 'Pending HRMO/HHRMD Review') && (
        <>
          <Button
            size="sm"
            onClick={() =>
              handleInitialAction(request.id, 'forward')
            }
          >
            Verify &amp; Forward to Commission
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() =>
              handleInitialAction(request.id, 'reject')
            }
          >
            Reject &amp; Return to HRO
          </Button>
        </>
      )}
    {/* Commission decision */}
    {(role === ROLES.HHRMD || role === ROLES.HRMO) &&
      request.reviewStage === 'commission_review' &&
      request.status.includes('Awaiting Commission Decision') && (
        <>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() =>
              handleCommissionDecision(request.id, 'approved')
            }
          >
            Approved by Commission
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() =>
              handleCommissionDecision(request.id, 'rejected')
            }
          >
            Rejected by Commission
          </Button>
        </>
      )}
  </>
)}
{/* HRO Correction Actions */}
{role === ROLES.HRO &&
  (request.status === 'Rejected by HRMO - Awaiting HRO Correction' ||
   request.status === 'Rejected by HHRMD - Awaiting HRO Correction' ||
   request.status === 'Rejected by HRRP - Awaiting HRO Correction') && (
    <Button
      size="sm"
      className="bg-blue-600 hover:bg-blue-700 text-white"
      onClick={() => handleResubmit(request)}
    >
      Correct and Resubmit
    </Button>
  )}
```

- [ ] **Step 4: Update the status badge colors for HRRP statuses**

Find the status badge color logic (around line 1072-1090). Add HRRP-specific status colors. Replace the entire badge className with:

```tsx
className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
  request.status.includes('Approved by Commission')
    ? 'bg-green-100 text-green-800'
    : request.status.includes('Rejected by Commission')
      ? 'bg-red-100 text-red-800'
      : request.status.includes('Awaiting Commission')
        ? 'bg-blue-100 text-blue-800'
        : request.status === 'Approved by HRRP - Awaiting Commission Review'
          ? 'bg-indigo-100 text-indigo-800'
          : request.status === 'Pending HRRP Review'
            ? 'bg-purple-100 text-purple-800'
            : request.status.includes('Pending HRMO/HHRMD')
              ? 'bg-orange-100 text-orange-800'
              : request.status.includes('Awaiting HRO') ||
                request.status.includes('Correction')
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
}`}
```

- [ ] **Step 5: Update the workflow progress indicator for HRRP stage**

Find the workflow progress indicator (around line 1093-1154). Update it to show the HRRP review step. Replace the entire workflow progress div:

```tsx
<div className="flex items-center space-x-2 mt-2">
  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
    <span>Workflow:</span>
    <div className="flex items-center space-x-1">
      <div
        className={`w-2 h-2 rounded-full ${
          request.status !== 'Pending'
            ? 'bg-green-500'
            : 'bg-gray-300'
        }`}
      ></div>
      <span className="text-[10px]">HRO Submit</span>
      <div className="w-3 h-px bg-gray-300"></div>
      <div
        className={`w-2 h-2 rounded-full ${
          request.status === 'Approved by HRRP - Awaiting Commission Review' ||
          request.status.includes('Awaiting Commission') ||
          request.status.includes('Approved by Commission') ||
          request.status.includes('Rejected by Commission')
            ? 'bg-green-500'
            : request.status === 'Pending HRRP Review'
              ? 'bg-purple-500'
              : request.status === 'Rejected by HRRP - Awaiting HRO Correction'
                ? 'bg-red-500'
                : 'bg-gray-300'
        }`}
      ></div>
      <span className="text-[10px]">HRRP Review</span>
      <div className="w-3 h-px bg-gray-300"></div>
      <div
        className={`w-2 h-2 rounded-full ${
          request.status.includes('Approved by HRMO')
            ? 'bg-green-500'
            : request.status.includes('Approved by HHRMD')
              ? 'bg-green-500'
              : request.status === 'Approved by HRRP - Awaiting Commission Review' ||
                request.status === 'Pending HRMO/HHRMD Review'
                ? 'bg-orange-500'
                : request.status.includes('Awaiting Commission Decision')
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
        }`}
      ></div>
      <span className="text-[10px]">
        {request.status.includes('Approved by HRMO')
          ? 'HRMO ✓'
          : request.status.includes('Approved by HHRMD')
            ? 'HHRMD ✓'
            : 'HRMO/HHRMD Review'}
      </span>
      <div className="w-3 h-px bg-gray-300"></div>
      <div
        className={`w-2 h-2 rounded-full ${
          ['Approved by Commission', 'Rejected by Commission - Request Concluded'].includes(request.status)
            ? 'bg-green-500'
            : request.status.includes('Awaiting Commission Decision')
              ? 'bg-blue-500'
              : 'bg-gray-300'
        }`}
      ></div>
      <span className="text-[10px]">Commission Decision</span>
    </div>
  </div>
</div>
```

- [ ] **Step 6: Add hrrpReviewedBy display in the request card**

Find where `reviewedBy` is displayed (around line 1050-1055). Add a similar block for `hrrpReviewedBy` right after it:

```tsx
{request.hrrpReviewedBy && (
  <p className="text-sm text-muted-foreground">
    HRRP Reviewed by: {request.hrrpReviewedBy.name || 'N/A'} (
    {request.hrrpReviewedBy.username || 'N/A'})
  </p>
)}
```

- [ ] **Step 7: Update the card title for HRRP users**

Find the card title/description section (around line 966-973). Update to show HRRP-specific messaging:

```tsx
<CardTitle>
  {role === ROLES.HRO
    ? 'My Confirmation Requests'
    : role === ROLES.HRRP
      ? 'Review Confirmation Requests'
      : 'Review Confirmation Requests'}
</CardTitle>
<CardDescription>
  {role === ROLES.HRO
    ? 'View and manage your submitted confirmation requests.'
    : role === ROLES.HRRP
      ? 'Review HRO-submitted requests and forward approved ones to the Commission.'
      : 'Review, approve, or reject pending employee confirmation requests.'}
</CardDescription>
```

- [ ] **Step 8: Verify frontend changes compile**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 9: Commit frontend HRRP action changes**

```bash
git add src/app/dashboard/confirmation/page.tsx
git commit -m "feat: add HRRP review actions, buttons, and workflow indicator to confirmation page"
```

---

### Task 7: Update the [id] route to support hrrpReviewedBy

**Files:**
- Modify: `src/app/api/confirmations/[id]/route.ts`

- [ ] **Step 1: Add hrrpReviewedById to the update schema**

In `src/app/api/confirmations/[id]/route.ts`, update the Zod schema (around line 13-19) to include the new fields:

```typescript
const updateSchema = z.object({
  status: z.string().optional(),
  reviewStage: z.string().optional(),
  rejectionReason: z.string().optional(),
  reviewedById: z.string().optional(),
  decisionDate: z.string().datetime().optional(),
  commissionDecisionDate: z.string().datetime().optional(),
  hrrpReviewedById: z.string().optional(),
  hrrpReviewedAt: z.string().datetime().optional(),
});
```

- [ ] **Step 2: Add hrrpReviewedBy to the include in the update query**

Find the `db.confirmationRequest.update` call (around line 36-42) and add the relation:

```typescript
const updatedRequest = await db.confirmationRequest.update({
  where: { id },
  data: validatedData,
  include: {
    Employee: { select: { name: true, zanId: true } },
    User_ConfirmationRequest_hrrpReviewedByToUser: {
      select: { id: true, name: true, username: true },
    },
  },
});
```

- [ ] **Step 3: Verify the [id] route changes compile**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 4: Commit [id] route changes**

```bash
git add src/app/api/confirmations/[id]/route.ts
git commit -m "feat: add hrrpReviewedBy support to confirmation [id] route"
```

---

### Task 8: Update notification templates for HRRP-specific notifications

**Files:**
- Modify: `src/lib/notifications.ts:114-127` (confirmation notification templates)

- [ ] **Step 1: Add HRRP-specific notification templates**

In `src/lib/notifications.ts`, after the existing confirmation templates (around line 127), add:

```typescript
confirmationHrrpApproved: (employeeName: string, requestId: string) => ({
  message: `Confirmation request for ${employeeName} (${requestId}) has been approved by HRRP and forwarded to the Commission for review.`,
  link: `/dashboard/confirmation`,
}),

confirmationHrrpRejected: (employeeName: string, requestId: string, reason: string) => ({
  message: `Confirmation request for ${employeeName} (${requestId}) has been rejected by HRRP. Reason: ${reason}`,
  link: `/dashboard/confirmation`,
}),

confirmationPendingHrrpReview: (employeeName: string, requestId: string) => ({
  message: `New confirmation request for ${employeeName} (${requestId}) is pending your HRRP review.`,
  link: `/dashboard/confirmation`,
}),
```

- [ ] **Step 2: Verify notifications compile**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 3: Commit notification changes**

```bash
git add src/lib/notifications.ts
git commit -m "feat: add HRRP-specific notification templates for confirmation"
```

---

### Task 9: Update route permissions description

**Files:**
- Modify: `src/lib/route-permissions.ts:35-38`

- [ ] **Step 1: Update confirmation route description**

In `src/lib/route-permissions.ts`, update the confirmation route description:

```typescript
{
  pattern: '/dashboard/confirmation',
  allowedRoles: [ROLES.HRO, ROLES.HHRMD, ROLES.HRMO, ROLES.CSCS, ROLES.HRRP],
  description: 'Employee confirmation - HRO submits to HRRP, HRRP approves and forwards to Commission (HHRMD/HRMO)',
},
```

- [ ] **Step 2: Commit route permissions update**

```bash
git add src/lib/route-permissions.ts
git commit -m "docs: update confirmation route description for HRRP review workflow"
```

---

### Task 10: Manual testing and verification

- [ ] **Step 1: Start the development server**

Run:
```bash
npm run dev
```

- [ ] **Step 2: Test HRO submission flow**

1. Log in as HRO
2. Submit a confirmation request
3. Verify the status shows "Pending HRRP Review" (not "Pending HRMO/HHRMD Review")
4. Verify the workflow indicator shows "HRO Submit → HRRP Review → ..."

- [ ] **Step 3: Test HRRP approval flow**

1. Log in as HRRP at the same institution
2. Find the request with "Pending HRRP Review" status
3. Click "Verify & Forward to Commission"
4. Verify the status changes to "Approved by HRRP - Awaiting Commission Review"
5. Verify commission (HHRMD/HRMO) can see and act on the request

- [ ] **Step 4: Test HRRP rejection flow**

1. As HRO, submit another request
2. As HRRP, click "Reject & Return to HRO"
3. Provide a rejection reason
4. Verify status changes to "Rejected by HRRP - Awaiting HRO Correction"
5. As HRO, click "Correct and Resubmit"
6. Verify status changes back to "Pending HRRP Review"

- [ ] **Step 5: Test HRRP self-submission**

1. Log in as HRRP
2. Submit a confirmation request
3. Verify the request auto-approves to "Approved by HRRP - Awaiting Commission Review"
4. Verify commission can see and act on it

- [ ] **Step 6: Test legacy backward compatibility**

1. Verify any existing requests with "Pending HRMO/HHRMD Review" status still work
2. HHRMD/HRMO should still be able to review legacy requests
3. Legacy requests should not show HRRP review actions

- [ ] **Step 7: Test commission (HHRMD/HRMO) review on HRRP-approved requests**

1. Find a request in "Approved by HRRP - Awaiting Commission Review" status
2. As HHRMD/HRMO, verify "Verify & Forward to Commission" button appears
3. Click to forward to commission review
4. Verify status changes to commission_review stage
5. Test commission approval/rejection

- [ ] **Step 8: Run typecheck one final time**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 9: Final commit with any remaining fixes**

```bash
git add -A
git commit -m "fix: address any issues found during manual testing"
```