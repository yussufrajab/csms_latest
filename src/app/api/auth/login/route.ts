import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { comparePassword } from '@/lib/password-utils';
import { logLoginAttempt, getClientIp } from '@/lib/audit-logger';
import { completeLogin } from '@/lib/auth-helpers';
import { createMfaToken, checkOtpRateLimit, maskEmail } from '@/lib/mfa-utils';
import { sendMfaEmail } from '@/lib/email';
import { withRateLimit } from '@/lib/rate-limiter';

const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export const POST = withRateLimit(async (request) => {
  try {
    const body = await request.json();
    const { username, password } = loginSchema.parse(body);

    console.log('Login attempt for username/email:', username);

    // Get client info for audit logging
    const ipAddress = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent');
    const deviceInfo: Record<string, any> | null = JSON.parse(request.headers.get('x-device-info') || 'null');

    // Check if the input is an email (contains @) or username
    const isEmail = username.includes('@');

    // Find user in database by either email or username
    const user = await db.user.findFirst({
      where: isEmail ? { email: username } : { username: username },
      include: {
        Institution: true,
        Employee: true,
      },
    });

    if (!user) {
      console.log('User not found:', username);

      // Log failed login attempt
      await logLoginAttempt({
        success: false,
        username,
        ipAddress,
        deviceInfo,
        failureReason: 'User not found',
      });

      return NextResponse.json(
        { success: false, message: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    // Auto-unlock expired standard lockouts
    const {
      autoUnlockExpiredAccounts,
      isAccountLocked,
      getRemainingLockoutTime,
      getAccountLockoutStatus,
      incrementFailedLoginAttempts,
      resetFailedLoginAttempts,
    } = await import('@/lib/account-lockout-utils');
    await autoUnlockExpiredAccounts();

    // Refresh user data after auto-unlock
    const refreshedUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        password: true,
        role: true,
        active: true,
        employeeId: true,
        institutionId: true,
        isTemporaryPassword: true,
        temporaryPasswordExpiry: true,
        mustChangePassword: true,
        passwordExpiresAt: true,
        gracePeriodStartedAt: true,
        lastExpirationWarningLevel: true,
        failedLoginAttempts: true,
        loginLockedUntil: true,
        loginLockoutReason: true,
        loginLockoutType: true,
        isManuallyLocked: true,
        lockedBy: true,
        lockedAt: true,
        lockoutNotes: true,
      },
    });

    if (!refreshedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 401 }
      );
    }

    // Use refreshed user data for subsequent checks
    const currentUser = refreshedUser;

    // Check if account is locked
    if (isAccountLocked(currentUser)) {
      const lockoutStatus = getAccountLockoutStatus(currentUser);
      console.log('Account locked for user:', username);

      // Still increment failed attempts to track persistent attack attempts
      // This allows upgrading from STANDARD to SECURITY lockout after 11 total attempts
      const lockoutResult = await incrementFailedLoginAttempts(
        currentUser.id,
        ipAddress,
        userAgent,
        deviceInfo
      );

      await logLoginAttempt({
        success: false,
        username: user.username,
        userId: user.id,
        userRole: user.role,
        ipAddress,
        deviceInfo,
        failureReason: `Account locked (${lockoutStatus.lockoutReason})`,
      });

      let message = 'Your account has been locked. ';
      if (lockoutStatus.canAutoUnlock && lockoutStatus.remainingMinutes > 0) {
        message += `Please try again in ${lockoutStatus.remainingMinutes} minutes.`;
      } else {
        message += 'Please contact an administrator to unlock your account.';
      }

      return NextResponse.json({ success: false, message }, { status: 403 });
    }

    if (!user.active) {
      console.log('User account is inactive:', username);

      // Log failed login attempt
      await logLoginAttempt({
        success: false,
        username: user.username,
        userId: user.id,
        userRole: user.role,
        ipAddress,
        deviceInfo,
        failureReason: 'Account is inactive',
      });

      return NextResponse.json(
        { success: false, message: 'Account is inactive' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      password,
      currentUser.password
    );

    if (!isPasswordValid) {
      console.log('Invalid password for user:', username);

      // Increment failed login attempts
      const lockoutResult = await incrementFailedLoginAttempts(
        currentUser.id,
        ipAddress,
        userAgent,
        deviceInfo
      );

      // Log failed login attempt
      await logLoginAttempt({
        success: false,
        username: user.username,
        userId: user.id,
        userRole: user.role,
        ipAddress,
        deviceInfo,
        failureReason: 'Invalid password',
      });

      let message = 'Invalid username or password';
      if (lockoutResult.locked) {
        message =
          'Too many failed login attempts. Your account has been locked. ';
        if (lockoutResult.lockoutType === 'standard') {
          message += 'Please try again in 30 minutes.';
        } else {
          message += 'Please contact an administrator to unlock your account.';
        }
      } else if (lockoutResult.remainingAttempts > 0) {
        const attemptsText = lockoutResult.remainingAttempts === 1
          ? '1 attempt remaining'
          : `${lockoutResult.remainingAttempts} attempts remaining`;
        message = `Invalid username or password, ${attemptsText}`;
      }

      return NextResponse.json({ success: false, message }, { status: 401 });
    }

    // Reset failed login attempts on successful login
    await resetFailedLoginAttempts(currentUser.id);

    // Check password status
    const now = new Date();
    const isTemporaryPasswordExpired =
      currentUser.isTemporaryPassword &&
      currentUser.temporaryPasswordExpiry &&
      new Date(currentUser.temporaryPasswordExpiry) < now;

    // If temporary password has expired, deny login
    if (isTemporaryPasswordExpired) {
      console.log('Temporary password expired for user:', username);
      return NextResponse.json(
        {
          success: false,
          message:
            'Your temporary password has expired. Please contact an administrator to reset your password.',
        },
        { status: 401 }
      );
    }

    // Check password expiration (non-temporary passwords only)
    if (!currentUser.isTemporaryPassword) {
      const {
        getPasswordExpirationStatus,
      } = await import('@/lib/password-expiration-utils');

      const expirationStatus = getPasswordExpirationStatus({
        role: currentUser.role,
        passwordExpiresAt: currentUser.passwordExpiresAt,
        gracePeriodStartedAt: currentUser.gracePeriodStartedAt,
        lastExpirationWarningLevel: currentUser.lastExpirationWarningLevel,
      });

      // If expired beyond grace period, deny login
      if (expirationStatus.isExpired && !expirationStatus.isInGracePeriod) {
        console.log('Password expired beyond grace period for user:', username);

        await logLoginAttempt({
          success: false,
          username: user.username,
          userId: user.id,
          userRole: user.role,
          ipAddress,
          deviceInfo,
          failureReason: 'Password expired beyond grace period',
        });

        return NextResponse.json(
          {
            success: false,
            message:
              'Your password has expired. Please contact an administrator to reset your password.',
          },
          { status: 401 }
        );
      }

      // If in grace period, allow login but set mustChangePassword
      if (expirationStatus.isInGracePeriod) {
        await db.user.update({
          where: { id: currentUser.id },
          data: { mustChangePassword: true },
        });
        currentUser.mustChangePassword = true;
      }
    }

    console.log('Login successful for user:', username);

    // --- MFA Gate ---
    // If user has an email address, require MFA verification before creating a session
    if (user.email) {
      const rateLimitCheck = await checkOtpRateLimit(currentUser.id);
      if (!rateLimitCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            message: `Too many verification requests. Please try again in ${rateLimitCheck.retryAfterSeconds} seconds.`,
          },
          { status: 429 }
        );
      }

      const mfaTokenExpiryMinutes = Number(process.env.MFA_TOKEN_EXPIRY_MINUTES) || 10;
      const { token: otpToken } = await createMfaToken(currentUser.id, 'OTP', user.email, ipAddress, userAgent);
      const { token: magicLinkToken } = await createMfaToken(currentUser.id, 'MAGIC_LINK', user.email, ipAddress, userAgent);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
      const magicLinkUrl = `${appUrl}/mfa/magic-link-confirm?token=${magicLinkToken}`;

      const emailResult = await sendMfaEmail(user.email, otpToken, magicLinkUrl, user.name, mfaTokenExpiryMinutes);

      if (!emailResult.success) {
        console.error('[LOGIN] Failed to send MFA email:', emailResult.error);
        return NextResponse.json(
          { success: false, message: 'Failed to send verification email. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        code: 'MFA_REQUIRED',
        data: {
          userId: currentUser.id,
          email: maskEmail(user.email),
        },
        message: 'MFA verification required',
      });
    }

    // No email on file — skip MFA and complete login directly
    console.log('[LOGIN] No email on file, skipping MFA for user:', username);

    return completeLogin({
      user: {
        ...currentUser,
        name: user.name,
        Institution: user.Institution,
        Employee: user.Employee,
      },
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
    console.error('[LOGIN_POST]', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}, 'auth');
