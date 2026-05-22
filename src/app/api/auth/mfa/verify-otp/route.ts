import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { completeLogin } from '@/lib/auth-helpers';
import { incrementOtpVerifyAttempts, verifyMfaToken } from '@/lib/mfa-utils';

const verifyOtpSchema = z.object({
  userId: z.string().min(1),
  otpCode: z.string().length(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, otpCode } = verifyOtpSchema.parse(body);

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      null;
    const userAgent = req.headers.get('user-agent') || null;
    const deviceInfo: Record<string, any> | null = JSON.parse(req.headers.get('x-device-info') || 'null');

    // Find the most recent unused OTP token for this user
    const mfaToken = await db.mfaToken.findFirst({
      where: {
        userId,
        tokenType: 'OTP',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!mfaToken) {
      return NextResponse.json(
        { success: false, message: 'No valid verification code found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check verification attempts
    const attemptCheck = await incrementOtpVerifyAttempts(mfaToken.id);
    if (!attemptCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many failed attempts. Please request a new verification code.' },
        { status: 400 }
      );
    }

    // Constant-time comparison to prevent timing attacks
    const tokenBuffer = Buffer.from(mfaToken.token, 'utf8');
    const inputBuffer = Buffer.from(otpCode, 'utf8');
    if (tokenBuffer.length !== inputBuffer.length || !crypto.timingSafeEqual(tokenBuffer, inputBuffer)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid verification code',
          data: { remainingAttempts: attemptCheck.remainingAttempts },
        },
        { status: 400 }
      );
    }

    // Mark token as used
    await db.mfaToken.update({
      where: { id: mfaToken.id },
      data: { usedAt: new Date() },
    });

    // Also invalidate any magic link tokens for this user
    await db.mfaToken.updateMany({
      where: { userId, tokenType: 'MAGIC_LINK', usedAt: null },
      data: { usedAt: new Date() },
    });

    // Get full user data for completeLogin
    const user = await db.user.findUnique({
      where: { id: userId },
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
    console.error('[MFA_VERIFY_OTP]', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}