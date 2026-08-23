'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/hooks/use-auth';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/lib/validator/auth';

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterFormValues) {
    setAuthError(null);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      router.push('/dashboard');
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : 'Registration failed. Please check your information.',
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-md w-full p-6 bg-slate-950 border border-slate-800 rounded-xl text-white shadow-xl"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">Create Account</h2>
        <p className="text-sm text-slate-400">Sign up to get started with Angelisyn</p>
      </div>

      {authError && (
        <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-sm text-red-300">
          {authError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
        <input
          type="text"
          autoComplete="name"
          {...register('name')}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Security Analyst"
        />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
        <input
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="name@example.com"
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
        <input
          type="password"
          autoComplete="new-password"
          {...register('password')}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-red-400 text-xs mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
        <input
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
        />
        {errors.confirmPassword && (
          <p className="text-red-400 text-xs mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-xs text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-400 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
