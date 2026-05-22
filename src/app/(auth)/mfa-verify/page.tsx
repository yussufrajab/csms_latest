'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { MfaVerifyForm } from '@/components/auth/mfa-verify-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { APP_NAME } from '@/lib/constants';
import { useEffect } from 'react';

export default function MfaVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!userId || !email) {
      router.push('/login');
    }
  }, [userId, email, router]);

  if (!userId || !email) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Logo width={120} height={80} className="object-contain" />
          </div>
          <CardTitle className="text-2xl font-headline">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaVerifyForm userId={userId} email={email} />
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Civil Service Commission. All rights reserved.
      </footer>
    </div>
  );
}