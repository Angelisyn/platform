'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();

  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <LoginForm />
    </main>
  );
}