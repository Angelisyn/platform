'use client';

import { PageHeader } from '@/components/dashboard/page-header';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account preferences and platform configuration."
      />
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-200">
        <p className="text-slate-400">Account and platform settings coming soon.</p>
      </div>
    </div>
  );
}
