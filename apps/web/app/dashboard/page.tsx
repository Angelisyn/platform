'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const {
    user,
    logout,
  } = useAuth();

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-4xl p-8">
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="mt-4">
          Welcome,
          {' '}
          {user?.name}
        </p>

        <p>{user?.email}</p>

        <button
          onClick={logout}
          className="mt-8 rounded bg-red-600 px-4 py-2 text-white"
        >
          Logout
        </button>
      </main>
    </ProtectedRoute>
  );
}