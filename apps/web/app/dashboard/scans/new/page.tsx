'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Badge, Button, Card, Input, Spinner } from '@angelisyn/ui';
import { PageHeader } from '@/components/dashboard/page-header';
import { scansService } from '@/services/scans.service';
import { targetsService } from '@/services/targets.service';
import { projectsService } from '@/services/projects.service';
import { isApiError } from '@/lib/api';
import { createScanSchema, type CreateScanInput } from '@/lib/validator/scans';
import type { Target } from '@/types/targets';
import type { Project } from '@/types/projects';

const SCAN_TYPE_OPTIONS = [
  { value: 'NETWORK_DISCOVERY', label: 'Network Discovery (Ping / ARP sweep)' },
  { value: 'PORT_SCAN', label: 'Port & Service Scan (TCP/UDP service detection)' },
  { value: 'VULNERABILITY_SCAN', label: 'Vulnerability Audit (Known CVE checks)' },
  { value: 'WEB_ASSESSMENT', label: 'Web Security Audit (HTTP headers / TLS checks)' },
] as const;

type LaunchErrorKind = 'network' | 'validation' | 'api';

interface LaunchError {
  kind: LaunchErrorKind;
  message: string;
}

/**
 * Classifies scan-creation failures so the UI can distinguish a network
 * failure from a backend validation rejection and a generic API error.
 */
function classifyLaunchError(err: unknown): LaunchError {
  if (isApiError(err)) {
    if (err.status === 0) {
      return { kind: 'network', message: err.message };
    }
    if (err.isValidationError) {
      return { kind: 'validation', message: err.message };
    }
    return { kind: 'api', message: err.message };
  }
  return { kind: 'api', message: err instanceof Error ? err.message : 'Failed to launch scan' };
}

function launchErrorTitle(kind: LaunchErrorKind): string {
  switch (kind) {
    case 'network':
      return 'Network error — unable to reach the API';
    case 'validation':
      return 'Invalid scan request';
    case 'api':
      return 'API error';
  }
}

function NewScanFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTargetId = searchParams.get('targetId') || '';

  const [targets, setTargets] = useState<Target[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<LaunchError | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateScanInput>({
    resolver: zodResolver(createScanSchema),
    defaultValues: {
      name: `Local Scan - ${new Date().toLocaleDateString()}`,
      projectId: '',
      targetId: preselectedTargetId,
      scanType: 'PORT_SCAN',
    },
  });

  const selectedProjectId = watch('projectId');

  useEffect(() => {
    async function loadFormOptions() {
      try {
        setLoadingData(true);
        const [targetsData, projectsData] = await Promise.all([
          targetsService.getAll(),
          projectsService.getAll(),
        ]);
        setTargets(targetsData);
        setProjects(projectsData);

        if (preselectedTargetId && targetsData.length > 0) {
          const matchedTarget = targetsData.find((t) => t.id === preselectedTargetId);
          if (matchedTarget) {
            setValue('projectId', matchedTarget.projectId);
          }
        } else if (projectsData.length > 0) {
          setValue('projectId', projectsData[0].id);
        }
      } catch (err) {
        if (isApiError(err)) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load scan configuration');
        }
      } finally {
        setLoadingData(false);
      }
    }

    void loadFormOptions();
  }, [preselectedTargetId, setValue]);

  const filteredTargets = selectedProjectId
    ? targets.filter((t) => t.projectId === selectedProjectId)
    : targets;

  const onSubmit = async (data: CreateScanInput) => {
    try {
      setSubmitting(true);
      setError(null);
      setLaunchError(null);
      const newScan = await scansService.create(data);
      router.push(`/dashboard/scans/${newScan.id}`);
    } catch (err) {
      setLaunchError(classifyLaunchError(err));
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Spinner />
        <span className="text-slate-400">Loading scan configuration...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <PageHeader
        title="New Scan"
        description="Configure and launch a local security assessment against one of your targets."
        badge={<Badge>Local Execution Engine</Badge>}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Scans', href: '/dashboard/scans' },
          { label: 'New Scan' },
        ]}
      />

      {error && <Alert>{error}</Alert>}

      {launchError && (
        <Alert>
          <div className="space-y-1">
            <p className="font-semibold">{launchErrorTitle(launchError.kind)}</p>
            <p className="text-sm">{launchError.message}</p>
          </div>
        </Alert>
      )}

      {projects.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400 space-y-4">
          <p className="text-lg font-semibold text-white">No projects available</p>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You need to create a project before launching a scan. Create a project, then add at least one target.
          </p>
          <Link href="/dashboard/projects">
            <Button>Create a Project First</Button>
          </Link>
        </div>
      ) : targets.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400 space-y-4">
          <p className="text-lg font-semibold text-white">No targets available</p>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You need to add at least one target before launching a scan. Targets define the IP addresses, hostnames, or domains to assess.
          </p>
          <Link href="/dashboard/targets">
            <Button>Add a Target First</Button>
          </Link>
        </div>
      ) : (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Scan Name
              </label>
              <Input
                placeholder="e.g. Infrastructure Discovery Scan"
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Project
                </label>
                <select
                  {...register('projectId')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.projectId && (
                  <p className="mt-1 text-xs text-red-400">{errors.projectId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Target System
                </label>
                <select
                  {...register('targetId')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Target...</option>
                  {filteredTargets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.target})
                    </option>
                  ))}
                </select>
                {errors.targetId && (
                  <p className="mt-1 text-xs text-red-400">{errors.targetId.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Assessment Type
              </label>
              <select
                {...register('scanType')}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {SCAN_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.scanType && (
                <p className="mt-1 text-xs text-red-400">{errors.scanType.message}</p>
              )}
            </div>

            <div className="p-4 rounded-xl border border-blue-800/60 bg-blue-950/40 text-blue-200 text-xs space-y-1">
              <p className="font-semibold uppercase tracking-wider text-blue-400">
                Execution Architecture &bull; LOCAL ONLY
              </p>
              <p className="text-slate-300">
                This assessment job will be executed directly via the local server process engine. No external scanning APIs or cloud keys are required.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Link href="/dashboard/scans">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Initiating Scan...' : 'Start Local Scan'}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

export default function NewScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading form...</span>
        </div>
      }
    >
      <NewScanFormContent />
    </Suspense>
  );
}
