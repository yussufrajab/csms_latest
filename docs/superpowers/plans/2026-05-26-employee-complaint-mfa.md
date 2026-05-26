# Employee Complaint MFA via Magic Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement magic link MFA for complaint submission, requiring employees to verify their identity via email before submitting complaints.

**Architecture:** Store pending complaint data in sessionStorage, send magic link with encoded complaint, validate token and create complaint on link click. Simple UX: submit → email sent → click link → complaint created.

**Tech Stack:** Next.js 14, React, TypeScript, Prisma, Zod, Resend (email), Tailwind CSS

---

## Files Overview

| File | Purpose |
|------|---------|
| `src/app/api/complaints/magic-link-verify/route.ts` | New API route to validate magic link token and create complaint |
| `src/app/mfa/magic-link-confirm/page.tsx` | New page to handle magic link clicks from email |
| `src/app/dashboard/complaints/page.tsx` | Modify to remove OTP modal, add magic link flow |
| `src/lib/email.ts` | Update to add complaint-specific magic link email template |
| `src/app/api/complaints/mfa-initiate/route.ts` | Minor fix to include complaint data in metadata |

---

### Task 1: Create Magic Link Verify API Route

**Files:**
- Create: `src/app/api/complaints/magic-link-verify/route.ts`

This route validates the magic link token and creates the complaint.

- [ ] **Step 1: Create the verify route file**

Create `src/app/api/complaints/magic-link-verify/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ROLES } from '@/lib/constants';
import { verifyMfaToken } from '@/lib/mfa-utils';
import { v4 as uuidv4 } from 'uuid';
import {
  createNotificationForRole,
  NotificationTemplates,
} from '@/lib/notifications';
import { sendRequestSubmissionEmails } from '@/lib/email';
import { logComplaintAction, getClientIp } from '@/lib/audit-logger';
import { authLogger } from '@/lib/logger';

const magicLinkVerifySchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = magicLinkVerifySchema.parse(body);

    // Verify the MFA token (magic link type)
    const mfaResult = await verifyMfaToken(token, 'MAGIC_LINK');

    if (!mfaResult.valid) {
      authLogger.info({ reason: mfaResult.reason }, 'Magic link verification failed for complaint');
      return NextResponse.json(
        {
          success: false,
          message: mfaResult.reason || 'Invalid verification link',
          code: 'INVALID_TOKEN',
        },
        { status: 401 }
      );
    }

    // Token is valid - extract complaint data from query params or use sessionStorage fallback
    // The complaint data was encoded in the URL when the magic link was sent
    const url = new URL(req.url);
    const complaintDataParam = url.searchParams.get('complaintData');

    if (!complaintDataParam) {
      return NextResponse.json(
        { success: false, message: 'Missing complaint data', code: 'MISSING_DATA' },
        { status: 400 }
      );
    }

    // Parse the complaint data
    let complaintData;
    try {
      complaintData = JSON.parse(decodeURIComponent(complaintDataParam));
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid complaint data', code: 'INVALID_DATA' },
        { status: 400 }
      );
    }

    // Validate the complainant matches the token user
    if (complaintData.complainantId !== mfaResult.userId) {
      authLogger.warn({
        mfaUserId: mfaResult.userId,
        complaintComplainantId: complaintData.complainantId,
      }, 'Complainant mismatch in magic link verification');
      return NextResponse.json(
        { success: false, message: 'Invalid complainant', code: 'MISMATCH' },
        { status: 403 }
      );
    }

    const ipAddress = getClientIp(req.headers);
    const userAgent = req.headers.get('user-agent') || null;

    // Create the complaint
    const newComplaint = await db.complaint.create({
      data: {
        id: uuidv4(),
        complaintType: complaintData.complaintType,
        subject: complaintData.subject,
        details: complaintData.complaintText,
        complainantPhoneNumber: complaintData.complainantPhoneNumber,
        nextOfKinPhoneNumber: complaintData.nextOfKinPhoneNumber,
        attachments: complaintData.attachments || [],
        complainantId: mfaResult.userId,
        status: 'Submitted',
        reviewStage: 'initial',
        assignedOfficerRole: ROLES.DO,
        updatedAt: new Date(),
      },
    });

    // Get complainant's name for notification
    const complainant = await db.user.findUnique({
      where: { id: mfaResult.userId },
      select: { name: true },
    });

    // Create notification for officers
    if (complainant && complainant.name) {
      const notification = NotificationTemplates.complaintSubmitted(
        complainant.name,
        newComplaint.id,
        complaintData.subject
      );
      await createNotificationForRole(ROLES.DO, notification.message, notification.link);
      await createNotificationForRole(ROLES.HHRMD, notification.message, notification.link);
      await createNotificationForRole(ROLES.HRMO, notification.message, notification.link);

      // Send email notifications to CSC reviewers
      await sendRequestSubmissionEmails({
        requestType: 'Complaint',
        employeeName: complainant.name,
        requestId: newComplaint.id,
        submittedByName: complainant.name,
        dashboardPath: '/dashboard/complaints',
      });
    }

    // Audit log
    await logComplaintAction({
      action: 'SUBMITTED',
      complaintId: newComplaint.id,
      complainantId: mfaResult.userId,
      subject: complaintData.subject,
      performedById: mfaResult.userId,
      performedByUsername: complainant?.name || 'unknown',
      performedByRole: 'EMPLOYEE',
      ipAddress,
      deviceInfo: null,
    });

    authLogger.info({
      complaintId: newComplaint.id,
      userId: mfaResult.userId,
    }, 'Complaint submitted with magic link verification');

    return NextResponse.json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        complaintId: newComplaint.id,
      },
    });
  } catch (error) {
    authLogger.error({ err: error }, 'Complaint magic link verification error');
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npm run typecheck`
Expected: No errors in the new file

- [ ] **Step 3: Commit**

```bash
git add src/app/api/complaints/magic-link-verify/route.ts
git commit -m "feat: add magic link verify API for complaint submission"
```

---

### Task 2: Create Magic Link Confirm Page

**Files:**
- Create: `src/app/mfa/magic-link-confirm/page.tsx`

This page handles the magic link click from email.

- [ ] **Step 1: Create the page file**

Create `src/app/mfa/magic-link-confirm/page.tsx`:

```typescript
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Mail, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

function MagicLinkConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [complaintId, setComplaintId] = useState('');

  const token = searchParams.get('token');
  const action = searchParams.get('action');
  const complaintDataParam = searchParams.get('complaintData');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Kiungo kisicho sahiki. Hakuna tokeni iliyopatikana.');
      return;
    }

    if (action !== 'complaint') {
      setStatus('error');
      setErrorMessage('Kitendo kisicho sahiki. Kiungo hiki hakiruhusiwi.');
      return;
    }

    // Call the verify endpoint
    const verifyMagicLink = async () => {
      try {
        const response = await fetch(`/api/complaints/magic-link-verify?complaintData=${encodeURIComponent(complaintDataParam || '')}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          setStatus('error');
          switch (result.code) {
            case 'INVALID_TOKEN':
            case 'TOKEN_EXPIRED':
              setErrorMessage('Kiungo kilikuwa kimekalify. Wasilisha lalamiko tena.');
              break;
            case 'TOKEN_USED':
              setErrorMessage('Hii ombi tayari limetumwa. Angalia malalamiko yako.');
              break;
            default:
              setErrorMessage(result.message || 'Hitilafu imetokea. Wasilisha lalamiko tena.');
          }
          return;
        }

        setStatus('success');
        setComplaintId(result.data?.complaintId || '');
        toast({
          title: 'Lalamiko Limewasilishwa',
          description: 'Lalamiko lako limewasilishwa kwa mafanikio.',
        });

        // Redirect to complaints page after 3 seconds
        setTimeout(() => {
          router.push('/dashboard/complaints');
        }, 3000);
      } catch {
        setStatus('error');
        setErrorMessage('Hitilafu ya mtandao. Wasilisha lalamiko tena.');
      }
    };

    verifyMagicLink();
  }, [token, action, complaintDataParam, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <div className="mx-auto w-16 h-16 mb-4">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
            </div>
          )}
          {status === 'success' && (
            <div className="mx-auto w-16 h-16 mb-4 text-green-500">
              <CheckCircle className="w-16 h-16" />
            </div>
          )}
          {status === 'error' && (
            <div className="mx-auto w-16 h-16 mb-4 text-red-500">
              <XCircle className="w-16 h-16" />
            </div>
          )}
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Inathibitisha...'}
            {status === 'success' && 'Lalamiko Limewasilishwa!'}
            {status === 'error' && 'Hitilafu'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Tunathibitisha kiungo chako...'}
            {status === 'success' && `Lalamiko lako ${complaintId ? `#${complaintId.slice(0, 8)}...` : ''} limewasilishwa kwa mafanikio.`}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Utarejeshwa kwenye ukurasa wa malalamiko kwa sekunde 3...
              </p>
              <Button onClick={() => router.push('/dashboard/complaints')} className="w-full">
                Angalia Malalamiko Yangu
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <Button onClick={() => router.push('/dashboard/complaints')} variant="outline" className="w-full">
                Rudi Kwenye Malalamiko
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MagicLinkConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <CardTitle>Inapakia...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <MagicLinkConfirmContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/mfa/magic-link-confirm/page.tsx
git commit -m "feat: add magic link confirmation page for complaint MFA"
```

---

### Task 3: Update Complaints Page for Magic Link Flow

**Files:**
- Modify: `src/app/dashboard/complaints/page.tsx`

Remove OTP modal logic, add magic link submission flow.

- [ ] **Step 1: Read current complaints page**

Read: `src/app/dashboard/complaints/page.tsx` (lines 1-100 to understand imports and state)

- [ ] **Step 2: Update imports and remove MFA modal references**

Remove from imports:
- `import { MfaVerifyForm } from '@/components/auth/mfa-verify-form';`

Keep all other imports.

- [ ] **Step 3: Replace MFA state with magic link state**

Find and replace (around lines 190-193):

```typescript
// OLD - Remove these:
const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
const [mfaEmail, setMfaEmail] = useState('');
const [mfaPendingData, setMfaPendingData] = useState<ComplaintFormValues | null>(null);

// NEW - Add these:
const [isMagicLinkSending, setIsMagicLinkSending] = useState(false);
const [showMagicLinkConfirmation, setShowMagicLinkConfirmation] = useState(false);
const [magicLinkEmail, setMagicLinkEmail] = useState('');
```

- [ ] **Step 4: Replace onEmployeeSubmit function**

Find `onEmployeeSubmit` function (around line 363) and replace entirely:

```typescript
const onEmployeeSubmit = async (data: ComplaintFormValues) => {
  if (!user) {
    toast({
      title: 'Hitilafu',
      description: 'Maelezo ya mtumiaji hayajapatikana.',
      variant: 'destructive',
    });
    return;
  }

  // Check if user has email set for MFA
  if (!user.email) {
    toast({
      title: 'Barua Pepe Inahitajika',
      description: 'Tafadhali ongeza barua pepe yako ya serikali kwenye ukurufi wako kabla ya kuwasilisha malalamiko.',
      variant: 'destructive',
      action: (
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/profile')}>
          Nenda kwa Ukurufu
        </Button>
      ),
    });
    return;
  }

  // Validate email domain for MFA
  const allowedDomains = ['.go.tz', '.ac.tz'];
  const hasValidDomain = allowedDomains.some(domain => user.email?.endsWith(domain));
  if (!hasValidDomain) {
    toast({
      title: 'Domain ya Email Isiyo Sahihi',
      description: 'Barua pepe yako lazima iwe na domain ya .go.tz au .ac.tz. Tafadhali sasisha barua pepe yako.',
      variant: 'destructive',
      action: (
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/profile')}>
          Sasisha Email
        </Button>
      ),
    });
    return;
  }

  setIsMagicLinkSending(true);

  // Store complaint data in sessionStorage as fallback
  const complaintData = {
    ...data,
    attachments: complaintLetterFile || evidenceFile
      ? [complaintLetterFile, evidenceFile].filter(Boolean)
      : [],
    complainantId: user.id,
  };
  sessionStorage.setItem('pendingComplaint', JSON.stringify(complaintData));

  // Encode complaint data for the URL
  const complaintDataParam = encodeURIComponent(JSON.stringify(complaintData));

  try {
    const response = await fetch(`/api/complaints/mfa-initiate?complaintData=${complaintDataParam}`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      toast({
        title: 'Imeshindikana',
        description: result.message || 'Imeshindwa kutuma kiungo cha kuthibitisha.',
        variant: 'destructive',
      });
      setIsMagicLinkSending(false);
      return;
    }

    // Show success state
    setMagicLinkEmail(user.email);
    setShowMagicLinkConfirmation(true);
    setIsMagicLinkSending(false);

    // Clear form
    form.reset();
    setRewrittenComplaint(null);
    setHasUsedAI(false);
    setComplaintLetterFile('');
    setEvidenceFile('');

    toast({
      title: 'Kiungo Kimetumwa',
      description: `Tumetuma kiungo cha kuthibitisha kwenye ${result.data?.email || user.email}. Bonyeza kiungo hicho kuwasilisha lalamiko.`,
    });
  } catch (error) {
    toast({
      title: 'Hitilafu',
      description: 'Hitilafu imetokea wakati wa kutuma kiungo. Tafadhali jaribu tena.',
      variant: 'destructive',
    });
    setIsMagicLinkSending(false);
  }
};
```

- [ ] **Step 5: Remove old MFA functions**

Remove these entire functions:
- `handleInitiateMfa` (around line 454-501)
- `handleMfaVerified` (around line 404-452)

- [ ] **Step 6: Update the complaints form UI to show magic link confirmation**

Find where the complaint form is rendered (around line 1490-1746). Replace the form area with magic link confirmation when `showMagicLinkConfirmation` is true.

After the `<CardHeader>` with "Wasilisha Lalamiko Jipya", add conditional rendering:

```tsx
{showMagicLinkConfirmation ? (
  <CardContent>
    <div className="text-center space-y-6 py-8">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <Mail className="w-10 h-10 text-green-600" />
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Barua Pepe Imetumwa!</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Tumetuma kiungo cha kuthibitisha kwenye <strong>{magicLinkEmail}</strong>. 
          Bonyeza kiungo hicho katika email yako kuwasilisha lalamiko lako.
        </p>
      </div>
      <Card className="bg-blue-50 border-blue-200 max-w-md mx-auto">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-blue-700">
            <strong>Muda:</strong> Kiungo kitakalifya baada ya dakika 15.
          </p>
          <p className="text-sm text-blue-700 mt-1">
            <strong>Notisi:</strong> Angalia folda yako ya spam ikiwa hujaona email.
          </p>
        </CardContent>
      </Card>
      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={() => setShowMagicLinkConfirmation(false)}
        >
          Andika Lalamiko Jingine
        </Button>
        <Button onClick={() => fetchComplaints(true)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sasisha Orodha
        </Button>
      </div>
    </div>
  </CardContent>
) : (
  <CardContent>
    {/* Existing Form content here */}
  </CardContent>
)}
```

- [ ] **Step 7: Update submit button to use new state**

Find the submit button in the form (around line 1713-1723). Update to use `isMagicLinkSending`:

```tsx
<Button
  type="submit"
  disabled={isRewriting || isMagicLinkSending || !hasUsedAI}
>
  {isMagicLinkSending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Inatuma Kiungo...
    </>
  ) : (
    <>
      <Send className="mr-2 h-4 w-4" />
      Wasilisha Lalamiko
    </>
  )}
</Button>
```

- [ ] **Step 8: Remove MFA modal from JSX**

Find and remove the MFA modal Dialog at the end of the file (search for `isMfaModalOpen`). Remove the entire Dialog component that shows the MFA modal.

- [ ] **Step 9: Run TypeScript check**

Run: `npm run typecheck`
Expected: No errors in complaints page

- [ ] **Step 10: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 11: Commit**

```bash
git add src/app/dashboard/complaints/page.tsx
git commit -m "feat: update complaints page to use magic link MFA flow"
```

---

### Task 4: Update Email Template for Complaint Magic Link

**Files:**
- Modify: `src/lib/email.ts`

Add a complaint-specific magic link email template.

- [ ] **Step 1: Read current email.ts to find existing MFA email function**

Read: `src/lib/email.ts` - find `sendMfaEmail` function to understand the current implementation

- [ ] **Step 2: Add complaint magic link email function**

After the existing `sendMfaEmail` function, add:

```typescript
interface ComplaintMagicLinkEmailParams {
  email: string;
  magicLink: string;
  employeeName: string;
  expiryMinutes?: number;
  complaintSubject?: string;
}

export async function sendComplaintMagicLinkEmail({
  email,
  magicLink,
  employeeName,
  expiryMinutes = 15,
  complaintSubject,
}: ComplaintMagicLinkEmailParams): Promise<EmailResult> {
  const subject = 'Thibitisha Kuwasilisha Lalamiko - CSMS';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thibitisha Kuwasilisha Lalamiko</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; margin: 20px 0; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mfumo wa Usimamizi wa Utumishi wa Umma</h1>
      <p>(CSMS)</p>
    </div>
    <div class="content">
      <h2>Habari ${employeeName},</h2>
      <p>Unataka kuwasilisha lalamiko katika Mfumo wa Usimamizi wa Utumishi wa Umma.</p>
      
      ${complaintSubject ? `<p><strong>Kichwa cha Lalamiko:</strong> ${complaintSubject}</p>` : ''}
      
      <p><strong>Bonyeza kitufe hapa chini ili kuthibitisha na kuwasilisha lalamiko lako:</strong></p>
      
      <a href="${magicLink}" class="button">Thibitisha na Wasilisha Lalamiko</a>
      
      <div class="warning">
        <strong>Tahadhari:</strong>
        <ul>
          <li>Hiki kiungo kitakalifya baada ya dakika ${expiryMinutes}.</li>
          <li>Kiungo hiki kinaweza kutumika mara moja tu.</li>
          <li>Ikiwa haukutaka kuwasilisha lalamiko, tafadhali puuza barua hii.</li>
        </ul>
      </div>
      
      <p>Au unaweza kunakili kiungo hiki na kukibandika katika kivinjari:</p>
      <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">${magicLink}</p>
    </div>
    <div class="footer">
      <p>Hii ni barua pepe ya kiotomatiki kutoka Mfumo wa CSMS.</p>
      <p>Ikiwa una maswali, wasiliana na ofisi ya HR yako.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Habari ${employeeName},

Unataka kuwasilisha lalamiko katika Mfumo wa Usimamizi wa Utumishi wa Umma (CSMS).
${complaintSubject ? `\nKichwa cha Lalamiko: ${complaintSubject}\n` : ''}
Bonyeza kiungo hapa chini ili kuthibitisha na kuwasilisha lalamiko lako:

${magicLink}

TAHADHARI:
- Hiki kiungo kitakalifya baada ya dakika ${expiryMinutes}.
- Kiungo hiki kinaweza kutumika mara moja tu.
- Ikiwa haukutaka kuwasilisha lalamiko, tafadhali puuza barua hii.

Hii ni barua pepe ya kiotomatiki kutoka Mfumo wa CSMS.
Ikiwa una maswali, wasiliana na ofisi ya HR yako.
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}
```

- [ ] **Step 3: Update mfa-initiate route to use new email function**

Read: `src/app/api/complaints/mfa-initiate/route.ts`

Update the import to use the new function and replace the email sending section:

Add import:
```typescript
import { sendComplaintMagicLinkEmail } from '@/lib/email';
```

Find the email sending section (around line 104-119) and replace:

```typescript
// OLD:
const emailResult = await sendMfaEmail(
  userEmail,
  otpToken,
  magicLinkUrl,
  user.name || 'Employee',
  mfaTokenExpiryMinutes
);

// NEW:
const emailResult = await sendComplaintMagicLinkEmail({
  email: userEmail,
  magicLink: magicLinkUrl,
  employeeName: user.name || 'Employee',
  expiryMinutes: mfaTokenExpiryMinutes,
  complaintSubject: complaintData.subject,
});
```

- [ ] **Step 4: Run TypeScript check**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/email.ts src/app/api/complaints/mfa-initiate/route.ts
git commit -m "feat: add complaint-specific magic link email template"
```

---

### Task 5: Testing

- [ ] **Step 1: Start development server**

Run: `npm run dev`
Expected: Server starts on port 9002

- [ ] **Step 2: Manual test flow**

1. Login as employee (zanid/payroll/zssf)
2. Go to profile page, add email ending with .go.tz
3. Go to complaints page
4. Fill complaint form, use AI rewrite
5. Click "Wasilisha Lalamiko"
6. Verify: See "Barua Pepe Imetumwa" message
7. Check email for magic link
8. Click magic link
9. Verify: Complaint created, success page shown
10. Verify: Redirect to complaints page, complaint visible in list

- [ ] **Step 3: Test error cases**

1. No email on profile → error toast with link to profile
2. Invalid email domain (not .go.tz/.ac.tz) → error toast
3. Expired token → error message on magic link page
4. Used token → error message

- [ ] **Step 4: Run existing tests**

Run: `npm test`
Expected: All tests pass

---

## Spec Coverage Checklist

- [x] Magic link verify API created
- [x] Magic link confirmation page created  
- [x] Complaints page updated to send magic link
- [x] Email template for complaint magic link
- [x] Session storage for complaint data
- [x] Error handling for all cases
- [x] Swahili UI messages

## Summary

This implementation:
1. Removes the complex OTP modal from complaints page
2. Adds a simple magic link flow: submit → email sent → click link → complaint created
3. Uses existing MfaToken infrastructure
4. Provides clear Swahili messaging throughout
5. Handles all error cases gracefully