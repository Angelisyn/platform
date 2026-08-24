'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Badge, Button, Card, Input, Spinner } from '@angelisyn/ui';
import { PageHeader } from '@/components/dashboard/page-header';
import { targetsService } from '@/services/targets.service';
import { isApiError } from '@/lib/api';
import {
  updateTargetSchema,
  type UpdateTargetInput,
} from '@/lib/validator/targets';
import type { Target } from '@/types/targets';
import type { Scan } from '@/types/scans';
import type { Finding } from '@/types/findings';

interface TargetDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TargetDetailPage({ params }: TargetDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [target, setTarget] = useState<Target | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedValue, setCopiedValue] = useState(false);

  const editForm = useForm<UpdateTargetInput>({
    resolver: zodResolver(updateTargetSchema),
  });

  const fetchTargetData = useCallback(async (targetId: string) => {
    try {
      setError(null);
      setIsNotFound(false);
      const [targetData, scansData, findingsData] = await Promise.all([
        targetsService.getById(targetId),
        targetsService.getScans(targetId),
        targetsService.getFindings(targetId),
      ]);
      setTarget(targetData);
      setScans(scansData);
      setFindings(findingsData);
      editForm.reset({
        name: targetData.name,
        target: targetData.target,
        type: targetData.type,
        status: targetData.status,
      });
    } catch (err) {
      if (isApiError(err)) {
        if (err.isNotFound) {
          setIsNotFound(true);
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load target details');
      }
    } finally {
      setLoading(false);
    }
  }, [editForm]);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      try {
        const [targetData, scansData, findingsData] = await Promise.all([
          targetsService.getById(id),
          targetsService.getScans(id),
          targetsService.getFindings(id),
        ]);
        if (isMounted) {
          setTarget(targetData);
          setScans(scansData);
          setFindings(findingsData);
          editForm.reset({
            name: targetData.name,
            target: targetData.target,
            type: targetData.type,
            status: targetData.status,
          });
        }
      } catch (err) {
        if (isMounted) {
          if (isApiError(err) && err.isNotFound) {
            setIsNotFound(true);
          } else {
            setError(
              isApiError(err)
                ? err.message
                : err instanceof Error
                ? err.message
                : 'Failed to load target details',
            );
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void initialLoad();

    return () => {
      isMounted = false;
    };
  }, [id, editForm]);

  const handleUpdate = async (values: UpdateTargetInput) => {
    if (!target) return;
    try {
      setActionError(null);
      const updated = await targetsService.update(target.id, values);
      setTarget(updated);
      setShowEditModal(false);
    } catch (err) {
      if (isApiError(err)) {
        setActionError(err.message);
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to update target');
      }
    }
  };

  const handleDelete = async () => {
    if (!target) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await targetsService.delete(target.id);
      router.push('/dashboard/targets');
    } catch (err) {
      if (isApiError(err)) {
        setActionError(err.message);
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to delete target');
      }
      setIsDeleting(false);
    }
  };

  const copyTargetValue = async () => {
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.target);
      setCopiedValue(true);
      setTimeout(() => setCopiedValue(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Spinner />
        <span className="text-slate-400">Loading target details...</span>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Target Not Found"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Targets', href: '/dashboard/targets' },
            { label: 'Not Found' },
          ]}
        />
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400 space-y-4">
          <p className="text-lg font-semibold text-white">Target Not Found</p>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            The target you are looking for does not exist or you do not have permission to access it.
          </p>
          <Link href="/dashboard/targets">
            <Button>&larr; Back to Targets</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error || !target) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Error Loading Target"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Targets', href: '/dashboard/targets' },
            { label: 'Error' },
          ]}
        />
        <Alert>
          <div className="flex items-center justify-between">
            <span>{error || 'An unexpected error occurred'}</span>
            <button
              onClick={() => {
                setLoading(true);
                void fetchTargetData(id);
              }}
              className="ml-4 underline text-xs hover:text-white"
            >
              Retry
            </button>
          </div>
        </Alert>
        <Link href="/dashboard/targets" className="inline-block text-sm text-blue-400 hover:underline">
          &larr; Back to Targets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={target.name}
        description={`Target identifier ${target.target} (${target.type.replace('_', ' ')})`}
        badge={
          <div className="flex items-center gap-2">
            <Badge>{target.type.replace('_', ' ')}</Badge>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                target.status === 'ACTIVE'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {target.status}
            </span>
          </div>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Targets', href: '/dashboard/targets' },
          { label: target.name },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/dashboard/targets">
              <button className="rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">
                &larr; Targets
              </button>
            </Link>
            <Link href={`/dashboard/scans/new?targetId=${target.id}`}>
              <button className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-sm shadow-emerald-600/20">
                + Run Local Scan
              </button>
            </Link>
            <Button onClick={() => { setActionError(null); setShowEditModal(true); }}>
              Edit Target
            </Button>
            <button
              onClick={() => { setActionError(null); setShowDeleteModal(true); }}
              className="rounded-lg border border-red-800/80 bg-red-950/30 px-3.5 py-2 text-sm font-medium text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors"
            >
              Delete
            </button>
          </div>
        }
      />

      {actionError && <Alert>{actionError}</Alert>}

      {/* Edit Target Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold">Edit Target</h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-300">
                  Target Name
                </label>
                <Input {...editForm.register('name')} />
                {editForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">{editForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-300">
                  Target Type
                </label>
                <select
                  {...editForm.register('type')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="IP_ADDRESS">IP Address</option>
                  <option value="HOSTNAME">Hostname</option>
                  <option value="DOMAIN">Domain</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-300">
                  Target Value
                </label>
                <Input {...editForm.register('target')} />
                {editForm.formState.errors.target && (
                  <p className="mt-1 text-xs text-red-400">{editForm.formState.errors.target.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-300">
                  Status
                </label>
                <select
                  {...editForm.register('status')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <Button onClick={editForm.handleSubmit(handleUpdate)}>
                  {editForm.formState.isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Spinner />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-red-900/50 bg-slate-950 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-full bg-red-950/80 border border-red-800/80">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">Delete Target</h2>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete target <span className="font-semibold text-white">&ldquo;{target.name}&rdquo;</span> ({target.target})?
            </p>
            <p className="text-xs text-slate-400">
              Note: The backend may reject this deletion if there are dependent active scans or findings referencing this target.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Target'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Metadata Card */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-slate-800 pb-3">
              Target Configuration
            </h3>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Target Name</dt>
                <dd className="font-medium text-white">{target.name}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Target Value</dt>
                <dd className="flex items-center gap-2 font-mono text-xs text-blue-400">
                  <span>{target.target}</span>
                  <button
                    onClick={() => void copyTargetValue()}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    {copiedValue ? 'Copied!' : 'Copy'}
                  </button>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Target Type</dt>
                <dd className="font-medium text-slate-200">{target.type.replace('_', ' ')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Status</dt>
                <dd>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      target.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {target.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-slate-800 pb-3">
              Scope & Association
            </h3>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-slate-400">Project Scope</dt>
                <dd>
                  <Link
                    href={`/dashboard/projects/${target.projectId}`}
                    className="font-medium text-blue-400 hover:underline text-xs"
                  >
                    {target.project?.name || target.projectName || target.projectId} &rarr;
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Target ID</dt>
                <dd className="font-mono text-xs text-slate-400 truncate max-w-[180px]">
                  {target.id}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Created At</dt>
                <dd className="font-medium text-slate-200">
                  {new Date(target.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>

      {/* Related Scans Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Related Scans ({scans.length})</h2>
          <Link
            href={`/dashboard/scans/new?targetId=${target.id}`}
            className="text-xs text-blue-400 hover:underline"
          >
            + Run Scan on this Target
          </Link>
        </div>

        {scans.length === 0 ? (
          <Card>
            <div className="p-8 text-center text-slate-400 space-y-3">
              <p className="text-sm">No local scans have been executed on this target yet.</p>
              <Link href={`/dashboard/scans/new?targetId=${target.id}`}>
                <Button>Start First Scan</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => (
              <Card key={scan.id}>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <Link
                      href={`/dashboard/scans/${scan.id}`}
                      className="font-semibold text-white hover:text-blue-400 transition-colors"
                    >
                      {scan.name}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Type: {scan.scanType} &bull; Mode: {scan.executionMode} &bull; Created {new Date(scan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      scan.status === 'COMPLETED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : scan.status === 'RUNNING'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800 animate-pulse'
                        : scan.status === 'FAILED'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {scan.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Related Findings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Related Findings ({findings.length})</h2>
          <Link href="/dashboard/findings" className="text-xs text-blue-400 hover:underline">
            View All Findings
          </Link>
        </div>

        {findings.length === 0 ? (
          <Card>
            <div className="p-8 text-center text-slate-400">
              No security vulnerabilities or findings recorded on this target.
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {findings.map((finding) => (
              <Card key={finding.id}>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <Link
                      href={`/dashboard/findings/${finding.id}`}
                      className="font-semibold text-white hover:text-blue-400 transition-colors"
                    >
                      {finding.title}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {finding.description}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      finding.severity === 'CRITICAL'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : finding.severity === 'HIGH'
                        ? 'bg-orange-950 text-orange-300 border border-orange-800'
                        : finding.severity === 'MEDIUM'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}
                  >
                    {finding.severity}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
