'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, Badge, Button, Logo } from '@angelisyn/ui';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/hooks/use-auth';

const PRIMARY_NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Projects', href: '/dashboard/projects' },
  { label: 'Targets', href: '/dashboard/targets' },
  { label: 'Scans', href: '/dashboard/scans' },
  { label: 'Findings', href: '/dashboard/findings' },
  { label: 'Reports', href: '/dashboard/reports' },
  { label: 'Settings', href: '/dashboard/settings' },
];

const SECONDARY_NAV_ITEMS = [
  { label: 'AI Agents', href: '/dashboard/agents' },
  { label: 'API Keys', href: '/dashboard/keys' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 text-white">
        <header className="flex md:hidden items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Logo />
            <Badge>V1 Platform</Badge>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </header>

        <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-slate-950 border-r border-slate-800 flex-shrink-0 p-6 flex flex-col justify-between`}>
          <div>
            <div className="hidden md:flex items-center gap-3 mb-8">
              <Logo />
              <Badge>V1 Platform</Badge>
            </div>

            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 px-4">
              Security Assessment
            </div>
            <nav className="space-y-1 mb-6">
              {PRIMARY_NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 px-4">
              Legacy / Extensions
            </div>
            <nav className="space-y-1">
              {SECONDARY_NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-slate-800 text-slate-200'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={user?.name || 'User'} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <Button onClick={logout}>Logout</Button>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}