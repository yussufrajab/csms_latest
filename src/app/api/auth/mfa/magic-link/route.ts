import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyMfaToken } from '@/lib/mfa-utils';
import { completeLogin } from '@/lib/auth-helpers';

const magicLinkSchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = magicLinkSchema.parse(body);

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      null;
    const userAgent = req.headers.get('user-agent') || null;
    const deviceInfo: Record<string, any> | null = JSON.parse(req.headers.get('x-device-info') || 'null');

    const result = await verifyMfaToken(token, 'MAGIC_LINK');

    if (!result.valid) {
      return NextResponse.json(
        { success: false, message: 'This link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Also invalidate any OTP tokens for this user
    await db.mfaToken.updateMany({
      where: { userId: result.userId, tokenType: 'OTP', usedAt: null },
      data: { usedAt: new Date() },
    });

    // Get full user data for completeLogin
    const user = await db.user.findUnique({
      where: { id: result.userId },
      include: { Institution: true, Employee: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 401 }
      );
    }

    return completeLogin({
      user,
      ipAddress,
      userAgent,
      deviceInfo,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }
    console.error('[MFA_MAGIC_LINK_VERIFY]', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}