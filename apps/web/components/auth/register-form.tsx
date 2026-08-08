'use client';

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
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      router.push('/login');
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Registration failed',
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-md"
    >
      <div>
        <label>Name</label>

        <input
          {...register('name')}
          className="w-full rounded border p-2"
        />

        {errors.name && (
          <p className="text-red-500 text-sm">
            {errors.name.message}
          </p>
        )}
      </div>

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

      <div>
        <label>Confirm Password</label>

        <input
          type="password"
          {...register('confirmPassword')}
          className="w-full rounded border p-2"
        />

        {errors.confirmPassword && (
          <p className="text-red-500 text-sm">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting
          ? 'Creating account...'
          : 'Create Account'}
      </button>
    </form>
  );
}
