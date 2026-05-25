# Confirmation Commission Letter Attachment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add required official commission letter upload when HHRMD/HRMO approve or reject a confirmation request, visible to HRO and HRRP.

**Architecture:** Add `commissionLetterKey` field to the `ConfirmationRequest` Prisma model. Frontend uploads the PDF to MinIO before submitting the decision PATCH. Backend validates the letter is present for commission decisions. Details modal shows the letter with preview/download buttons.

**Tech Stack:** Prisma, Next.js API routes, MinIO file storage, React (FileUpload component)

---

### Task 1: Add `commissionLetterKey` field to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma:76-77`

- [ ] **Step 1: Add the field to the ConfirmationRequest model**

Add `commissionLetterKey String?` after `commissionDecisionDate` in the `ConfirmationRequest` model:

```prisma
    commissionDecisionDate                       DateTime?
    commissionLetterKey                           String?
    hrrpReviewedById                             String?
```

- [ ] **Step 2: Push the schema change to the database**

Run: `npx prisma db push`
Expected: Schema applied successfully

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add commissionLetterKey to ConfirmationRequest schema"
```

---

### Task 2: Backend — validate and save `commissionLetterKey` on commission decisions

**Files:**
- Modify: `src/app/api/confirmations/route.ts:354-611`

- [ ] **Step 1: Add validation for `commissionLetterKey` in the PATCH handler**

In `src/app/api/confirmations/route.ts`, after the authorization check (around line 404, after `if (!authCheck.authorized)` block), add validation that commission decisions require a commission letter key:

```typescript
    // Validate that commission decisions include a commission letter
    if (isCommissionApprovalOrRejection && !body.commissionLetterKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'Commission letter is required for commission decisions',
        },
        { status: 400 }
      );
    }
```

- [ ] **Step 2: Include `commissionLetterKey` in the update data**

The `updateData` object is passed directly to `db.confirmationRequest.update`. Since `body.commissionLetterKey` is already destructured into `updateData` via `{ id, userRole, userId, ...updateData } = body`, it will be included automatically if present. No extra code needed — but we need to make sure the validation above runs before the update.

- [ ] **Step 3: Test manually with curl**

Run the dev server and test a PATCH request without `commissionLetterKey` for a commission decision — expect 400. Test with `commissionLetterKey` — expect success and the field saved.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/confirmations/route.ts
git commit -m "feat: validate commissionLetterKey required for commission decisions"
```

---

### Task 3: Frontend — add state and dialog for commission letter upload

**Files:**
- Modify: `src/app/dashboard/confirmation/page.tsx`

- [ ] **Step 1: Add state variables for commission letter dialog**

After the existing state declarations (around line 102, after `correctedLetterOfRequestFile`), add:

```typescript
  const [isCommissionDecisionModalOpen, setIsCommissionDecisionModalOpen] = useState(false);
  const [commissionDecisionType, setCommissionDecisionType] = useState<'approved' | 'rejected' | null>(null);
  const [commissionDecisionRequestId, setCommissionDecisionRequestId] = useState<string | null>(null);
  const [commissionLetterFile, setCommissionLetterFile] = useState<string>('');
  const [commissionRejectionReason, setCommissionRejectionReason] = useState('');
  const [isCommissionSubmitting, setIsCommissionSubmitting] = useState(false);
```

- [ ] **Step 2: Replace the commission decision buttons to open a dialog instead of calling handler directly**

In the commission decision buttons section (around lines 1286-1304), replace the two `onClick` handlers:

Change from:
```tsx
onClick={() =>
  handleCommissionDecision(request.id, 'approved')
}
```
to:
```tsx
onClick={() => {
  setCommissionDecisionRequestId(request.id);
  setCommissionDecisionType('approved');
  setCommissionLetterFile('');
  setCommissionRejectionReason('');
  setIsCommissionDecisionModalOpen(true);
}}
```

And change from:
```tsx
onClick={() =>
  handleCommissionDecision(request.id, 'rejected')
}
```
to:
```tsx
onClick={() => {
  setCommissionDecisionRequestId(request.id);
  setCommissionDecisionType('rejected');
  setCommissionLetterFile('');
  setCommissionRejectionReason('');
  setIsCommissionDecisionModalOpen(true);
}}
```

- [ ] **Step 3: Rewrite `handleCommissionDecision` to upload letter first then submit decision**

Replace the existing `handleCommissionDecision` function (lines 615-636) with:

```typescript
  const handleCommissionDecision = async () => {
    if (!commissionDecisionRequestId || !commissionDecisionType || !user) return;

    if (!commissionLetterFile) {
      toast({
        title: 'Barua Inahitajika',
        description: 'Tafadhali pakia barua rasmi ya Tume kabla ya kuwasilisha uamuzi.',
        variant: 'destructive',
      });
      return;
    }

    if (commissionDecisionType === 'rejected' && !commissionRejectionReason.trim()) {
      toast({
        title: 'Sababu ya Kukataa Inahitajika',
        description: 'Tafadhali toa sababu ya kukataa ombi hili.',
        variant: 'destructive',
      });
      return;
    }

    setIsCommissionSubmitting(true);
    try {
      const finalStatus =
        commissionDecisionType === 'approved'
          ? 'Approved by Commission'
          : 'Rejected by Commission - Request Concluded';

      const payload: Record<string, any> = {
        status: finalStatus,
        reviewStage: 'completed',
        commissionDecisionDate: new Date().toISOString(),
        reviewedById: user.id,
        commissionLetterKey: commissionLetterFile,
      };

      if (commissionDecisionType === 'rejected') {
        payload.rejectionReason = commissionRejectionReason;
      }

      await handleUpdateRequest(
        commissionDecisionRequestId,
        payload,
        commissionDecisionType === 'approved'
          ? 'Confirmation approved by Commission'
          : 'Confirmation rejected by Commission'
      );

      setIsCommissionDecisionModalOpen(false);
      setCommissionLetterFile('');
      setCommissionRejectionReason('');
      setCommissionDecisionRequestId(null);
      setCommissionDecisionType(null);
    } catch (error) {
      log.error({ err: error }, 'Commission decision error');
      toast({
        title: 'Error',
        description: 'Imeshindwa kufanya uamuzi. Tafadhali jaribu tena.',
        variant: 'destructive',
      });
    } finally {
      setIsCommissionSubmitting(false);
    }
  };
```

- [ ] **Step 4: Add the commission decision dialog JSX**

Add the dialog after the existing details modal (after line 1627, before `{currentRequestToAction &&`):

```tsx
      {/* Commission Decision Modal */}
      <Dialog
        open={isCommissionDecisionModalOpen}
        onOpenChange={setIsCommissionDecisionModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {commissionDecisionType === 'approved'
                ? 'Approved by Commission'
                : 'Rejected by Commission'}
            </DialogTitle>
            <DialogDescription>
              {commissionDecisionType === 'approved'
                ? 'Pakia barua rasmi ya Tume ya kuidhinisha ombi hili.'
                : 'Pakia barua rasmi ya Tume ya kukataa ombi hili na toa sababu.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {commissionDecisionType === 'rejected' && (
              <div className="space-y-2">
                <Label className="font-semibold">Sababu ya Kukataa *</Label>
                <Textarea
                  value={commissionRejectionReason}
                  onChange={(e) => setCommissionRejectionReason(e.target.value)}
                  placeholder="Toa sababu ya kukataa ombi hili..."
                  rows={3}
                />
              </div>
            )}
            <div className="space-y-2">
              <FileUpload
                label="Barua Rasmi ya Tume *"
                description="Pakia barua rasmi ya Tume (PDF pekee, max 1MB)"
                accept=".pdf"
                maxSize={1}
                folder="confirmation/commission-letters"
                value={commissionLetterFile}
                onChange={(value) => setCommissionLetterFile(value as string)}
                onPreview={(objectKey) => {
                  setPreviewObjectKey(objectKey);
                  setIsPreviewModalOpen(true);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCommissionDecisionModalOpen(false)}
              disabled={isCommissionSubmitting}
            >
              Ghairi
            </Button>
            <Button
              className={
                commissionDecisionType === 'approved'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : ''
              }
              variant={commissionDecisionType === 'rejected' ? 'destructive' : 'default'}
              onClick={handleCommissionDecision}
              disabled={
                isCommissionSubmitting ||
                !commissionLetterFile ||
                (commissionDecisionType === 'rejected' && !commissionRejectionReason.trim())
              }
            >
              {isCommissionSubmitting ? 'Inawasilisha...' : 'Wasilisha Uamuzi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
```

- [ ] **Step 5: Verify the dialog renders correctly**

Run: `npm run dev` and navigate to the confirmation page as HHRMD/HRMO user. Click "Approved by Commission" or "Rejected by Commission" — the dialog should appear with the file upload field and submit button (disabled until file is uploaded).

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/confirmation/page.tsx
git commit -m "feat: add commission letter upload dialog for commission decisions"
```

---

### Task 4: Frontend — show commission letter in details modal

**Files:**
- Modify: `src/app/dashboard/confirmation/page.tsx`

- [ ] **Step 1: Add `commissionLetterKey` to the `ConfirmationRequest` interface**

In the `ConfirmationRequest` interface (around line 55-64), add the new field:

```typescript
  commissionDecisionDate?: string | null;
  commissionLetterKey?: string | null;
  hrrpReviewedAt?: string | null;
```

- [ ] **Step 2: Add commission letter section to the details modal**

After the "Attached Documents" section (after line 1615, before the closing `</div>` of the scrollable area), add:

```tsx
                  {/* Commission Letter */}
                  {selectedRequest.commissionLetterKey && (
                    <div className="pt-3 mt-3 border-t">
                      <Label className="font-semibold">Barua Rasmi ya Tume</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between p-2 rounded-md border bg-blue-50 dark:bg-blue-950/30 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-foreground">
                              Barua Rasmi ya Tume
                            </span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => handlePreviewFile(selectedRequest.commissionLetterKey!)}
                            >
                              Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={async () => {
                                try {
                                  const response = await fetch(
                                    `/api/files/download/${selectedRequest.commissionLetterKey}`,
                                    { credentials: 'include' }
                                  );
                                  if (response.ok) {
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'Barua-Rasmi-ya-Tume.pdf';
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                  } else {
                                    toast({
                                      title: 'Download Failed',
                                      description: 'Could not download the file. Please try again.',
                                      variant: 'destructive',
                                    });
                                  }
                                } catch (error) {
                                  log.error({ err: error }, 'Download failed');
                                  toast({
                                    title: 'Download Failed',
                                    description: 'Could not download the file. Please try again.',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
```

- [ ] **Step 3: Verify the commission letter appears in the details modal**

Log in as HRO/HRRP, view a confirmation request that has been approved/rejected by commission with a letter attached. The "Barua Rasmi ya Tume" section should appear below the submission documents with Preview and Download buttons.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/confirmation/page.tsx
git commit -m "feat: display commission letter in confirmation details modal"
```

---

### Task 5: Full workflow verification

**Files:** None (manual testing)

- [ ] **Step 1: Build the production app**

Run: `rm -rf .next && npm run build`

- [ ] **Step 2: Start production server and test the full flow**

1. Log in as HHRMD/HRMO
2. Navigate to confirmation page
3. Find a request awaiting commission decision
4. Click "Approved by Commission" — dialog should appear
5. Verify: Submit button is disabled without letter upload
6. Upload a PDF — Submit button becomes enabled
7. Submit — request status should change, letter should be saved
8. Log in as HRO/HRRP
9. View the same request's details — "Barua Rasmi ya Tume" section should show with Preview/Download
10. Repeat for rejection flow (including rejection reason requirement)

- [ ] **Step 3: Commit any fixes if needed**

---

## Self-Review

**Spec coverage:**
- Commission letter required for both approve/reject — Task 2 (backend validation) + Task 3 (frontend dialog with disabled button)
- PDF only, 1MB max — Task 3 (FileUpload component props)
- HRO/HRRP can view — Task 4 (details modal section)
- Existing decisions unaffected — Task 1 (nullable field)

**Placeholder scan:** No TBDs, all code blocks are complete.

**Type consistency:** `commissionLetterKey` used consistently across schema, API, and frontend interface.