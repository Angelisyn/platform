'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/hooks/use-auth';

import {
  loginSchema,
  type LoginFormValues,
} from '@/lib/validators/auth';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values);

      router.push('/dashboard');
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Login failed',
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-md"
    >
      <div>
        <label>Email</label>

        <input
          type="email"
          {...register('email')}
          className="w-full rounded border p-2"
        />

        {errors.email && (
          <p className="text-red-500 text-sm">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label>Password</label>

        <input
          type="password"
          {...register('password')}
          className="w-full rounded border p-2"
        />

        {errors.password && (
          <p className="text-red-500 text-sm">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}