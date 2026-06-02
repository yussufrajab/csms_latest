import nodemailer from 'nodemailer';
import { emailLogger } from '@/lib/logger';
import { db } from '@/lib/db';
import { ROLES } from '@/lib/constants';

export type RequestType =
  | 'Promotion'
  | 'Confirmation'
  | 'Leave Without Pay'
  | 'Cadre Change'
  | 'Retirement'
  | 'Resignation'
  | 'Termination'
  | 'Service Extension'
  | 'Complaint';

let transporter: nodemailer.Transporter | null = null;

function createTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 25,
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    pool: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  return transporter;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<SendEmailResult> {
  try {
    const transport = createTransporter();
    const result = await transport.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'CSMS'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    emailLogger.info({ to, messageId: result.messageId }, 'Email sent');
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    emailLogger.error({ err: error, to }, 'Failed to send email');
    return { success: false, error: error.message };
  }
}


function generateRequestSubmittedEmailHtml(params: {
  requestType: RequestType;
  employeeName: string;
  requestId: string;
  submittedByName: string;
  dashboardLink: string;
}): { html: string; text: string } {
  const { requestType, employeeName, requestId, submittedByName, dashboardLink } = params;
  const text = `New ${requestType} request submitted by ${submittedByName} for employee ${employeeName} (ID: ${requestId}). Requires your review. View at ${dashboardLink}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #1e3a5f; padding: 24px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Civil Service Management System</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 16px;">New ${requestType} Request</h2>
              <p style="color: #3f3f46; font-size: 14px; margin: 0 0 12px;">A new <strong>${requestType}</strong> request has been submitted and requires your review.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #f4f4f5; border-radius: 8px; padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px;">Employee</td>
                        <td style="color: #18181b; font-size: 14px; font-weight: bold; padding-bottom: 4px;">${employeeName}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px;">Request ID</td>
                        <td style="color: #18181b; font-size: 14px; font-weight: bold; padding-bottom: 4px;">${requestId}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Submitted By</td>
                        <td style="color: #18181b; font-size: 14px; font-weight: bold;">${submittedByName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <a href="${dashboardLink}" style="display: inline-block; background-color: #1e3a5f; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: bold;">Review Request</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f5; padding: 16px 32px; text-align: center;">
              <p style="color: #a1a1aa; font-size: 11px; margin: 0;">Civil Service Management System &mdash; Zanzibar Government</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { html, text };
}

function generateRequestApprovedEmailHtml(params: {
  requestType: RequestType;
  employeeName: string;
  requestId: string;
  status: string;
  dashboardLink: string;
}): { html: string; text: string } {
  const { requestType, employeeName, requestId, status, dashboardLink } = params;
  const text = `Your ${requestType} request for employee ${employeeName} (ID: ${requestId}) has been ${status}. View at ${dashboardLink}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #16a34a; padding: 24px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Civil Service Management System</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="color: #16a34a; font-size: 18px; margin: 0 0 16px;">${requestType} Request Approved</h2>
              <p style="color: #3f3f46; font-size: 14px; margin: 0 0 12px;">Your <strong>${requestType}</strong> request has been <strong style="color: #16a34a;">${status}</strong>.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #f4f4f5; border-radius: 8px; padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px;">Employee</td>
                        <td style="color: #18181b; font-size: 14px; font-weight: bold; padding-bottom: 4px;">${employeeName}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px;">Request ID</td>
                        <td style="color: #18181b; font-size: 14px; font-weight: bold; padding-bottom: 4px;">${requestId}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Status</td>
                        <td style="color: #16a34a; font-size: 14px; font-weight: bold;">${status}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <a href="${dashboardLink}" style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: bold;">View Request</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f5; padding: 16px 32px; text-align: center;">
              <p style="color: #a1a1aa; font-size: 11px; margin: 0;">Civil Service Management System &mdash; Zanzibar Government</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { html, text };
}

function generateRequestRejectedEmailHtml(params: {
  requestType: RequestType;
  employeeName: string;
  requestId: string;
  reason: string;
  dashboardLink: string;
}): { html: string; text: string } {
  const { requestType, employeeName, requestId, reason, dashboardLink } = params;
  const text = `Your ${requestType} request for employee ${employeeName} (ID: ${requestId}) has been rejected. Reason: ${reason}. View at ${dashboardLink}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #dc2626; padding: 24px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Civil Service Management System</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="color: #dc2626; font-size: 18px; margin: 0 0 16px;">${requestType} Request Rejected</h2>
              <p style="color: #3f3f46; font-size: 14px; margin: 0 0 12px;">Your <strong>${requestType}</strong> request has been <strong style="color: #dc2626;">rejected</strong>.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #f4f4f5; border-radius: 8px; padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px;">Employee</td>
                        <td style="color: #18181b; font-size: 14px; font-weight: bold; padding-bottom: 4px;">${employeeName}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px;">Request ID</td>
                        <td style="color: #18181b; font-size: 14px; font-weight: bold; padding-bottom: 4px;">${requestId}</td>
                      </tr>
                      <tr>
                        <td style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reason</td>
                        <td style="color: #dc2626; font-size: 14px; font-weight: bold;">${reason}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <a href="${dashboardLink}" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: bold;">View Request</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f5; padding: 16px 32px; text-align: center;">
              <p style="color: #a1a1aa; font-size: 11px; margin: 0;">Civil Service Management System &mdash; Zanzibar Government</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { html, text };
}

export async function sendRequestSubmissionEmails(params: {
  requestType: RequestType;
  employeeName: string;
  requestId: string;
  submittedByName: string;
  dashboardPath: string;
}): Promise<void> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const reviewerRoles: string[] = [ROLES.HHRMD!, ROLES.HRMO!, ROLES.DO!];

    const users = await db.user.findMany({
      where: {
        role: { in: reviewerRoles },
        active: true,
        email: { not: null },
      },
      select: { email: true, name: true },
    });

    const { html, text } = generateRequestSubmittedEmailHtml({
      requestType: params.requestType,
      employeeName: params.employeeName,
      requestId: params.requestId,
      submittedByName: params.submittedByName,
      dashboardLink: `${appUrl}${params.dashboardPath}`,
    });

    for (const user of users) {
      if (!user.email) continue;
      const result = await sendEmail(
        user.email,
        `[CSMS] New ${params.requestType} Request - ${params.employeeName}`,
        html,
        text
      );
      if (!result.success) {
        emailLogger.error({ err: result.error, email: user.email }, 'Failed to send submission notification');
      }
    }
  } catch (error) {
    emailLogger.error({ err: error }, 'sendRequestSubmissionEmails failed');
  }
}

export async function sendRequestStatusUpdateEmail(params: {
  requestType: RequestType;
  employeeName: string;
  requestId: string;
  submittedById: string;
  status: string;
  rejectionReason?: string;
  dashboardPath: string;
}): Promise<void> {
  try {
    const submitter = await db.user.findUnique({
      where: { id: params.submittedById },
      select: { email: true, name: true },
    });

    if (!submitter?.email) {
      emailLogger.info({ submittedById: params.submittedById }, 'No email on file for submitter, skipping notification');
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const statusLower = params.status.toLowerCase();
    const isApproval = statusLower.includes('approved') && !statusLower.includes('rejected');
    const isRejection = statusLower.includes('rejected');

    let subject: string;
    let html: string;
    let text: string;

    if (isApproval) {
      const template = generateRequestApprovedEmailHtml({
        requestType: params.requestType,
        employeeName: params.employeeName,
        requestId: params.requestId,
        status: params.status,
        dashboardLink: `${appUrl}${params.dashboardPath}`,
      });
      html = template.html;
      text = template.text;
      subject = `[CSMS] ${params.requestType} Request Approved - ${params.employeeName}`;
    } else if (isRejection) {
      const template = generateRequestRejectedEmailHtml({
        requestType: params.requestType,
        employeeName: params.employeeName,
        requestId: params.requestId,
        reason: params.rejectionReason || 'No reason provided',
        dashboardLink: `${appUrl}${params.dashboardPath}`,
      });
      html = template.html;
      text = template.text;
      subject = `[CSMS] ${params.requestType} Request Rejected - ${params.employeeName}`;
    } else {
      // Generic status update - use approved template with the actual status text
      const template = generateRequestApprovedEmailHtml({
        requestType: params.requestType,
        employeeName: params.employeeName,
        requestId: params.requestId,
        status: params.status,
        dashboardLink: `${appUrl}${params.dashboardPath}`,
      });
      html = template.html;
      text = template.text;
      subject = `[CSMS] ${params.requestType} Request Update - ${params.employeeName}`;
    }

    const result = await sendEmail(submitter.email, subject, html, text);
    if (!result.success) {
      emailLogger.error({ err: result.error, email: submitter.email }, 'Failed to send status update email');
    }
  } catch (error) {
    emailLogger.error({ err: error }, 'sendRequestStatusUpdateEmail failed');
  }
}