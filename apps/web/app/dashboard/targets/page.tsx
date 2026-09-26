'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Badge, Button, Card, Input, Spinner } from '@angelisyn/ui';
import { PageHeader } from '@/components/dashboard/page-header';
import { targetsService } from '@/services/targets.service';
import { projectsService } from '@/services/projects.service';
import { isApiError } from '@/lib/api';
import {
  createTargetSchema,
  updateTargetSchema,
  type CreateTargetInput,
  type UpdateTargetInput,
} from '@/lib/validator/targets';
import type { Target } from '@/types/targets';
import type { Project } from '@/types/projects';

function TargetsPageContent() {
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId') || '';
  const [targets, setTargets] = useState<Target[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<Target | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const createForm = useForm<CreateTargetInput>({
    resolver: zodResolver(createTargetSchema),
    defaultValues: {
      name: '',
      target: '',
      type: 'IP_ADDRESS',
      projectId: '',
    },
  });

  const editForm = useForm<UpdateTargetInput>({
    resolver: zodResolver(updateTargetSchema),
  });

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [targetsData, projectsData] = await Promise.all([
        targetsService.getAll(),
        projectsService.getAll(),
      ]);
      setTargets(targetsData);
      setProjects(projectsData);
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load targets data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      try {
        const [targetsData, projectsData] = await Promise.all([
          targetsService.getAll(),
          projectsService.getAll(),
        ]);
        if (isMounted) {
          setTargets(targetsData);
          setProjects(projectsData);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            isApiError(err)
              ? err.message
              : err instanceof Error
              ? err.message
              : 'Failed to load targets data',
          );
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
  }, []);

  const handleCreate = async (values: CreateTargetInput) => {
    try {
      setActionError(null);
      await targetsService.create(values);
      setShowCreateModal(false);
      createForm.reset();
      await fetchData();
    } catch (err) {
      if (isApiError(err)) {
        setActionError(err.message);
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to create target');
      }
    }
  };

  const startEditing = (target: Target) => {
    setActionError(null);
    setEditingTarget(target);
    editForm.reset({
      name: target.name,
      target: target.target,
      type: target.type,
      status: target.status,
    });
  };

  const handleUpdate = async (values: UpdateTargetInput) => {
    if (!editingTarget) return;
    try {
      setActionError(null);
      await targetsService.update(editingTarget.id, values);
      setEditingTarget(null);
      await fetchData();
    } catch (err) {
      if (isApiError(err)) {
        setActionError(err.message);
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to update target');
      }
    }
  };

  const confirmDelete = async () => {
    if (!deletingTarget) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await targetsService.delete(deletingTarget.id);
      setDeletingTarget(null);
      await fetchData();
    } catch (err) {
      if (isApiError(err)) {
        setActionError(err.message);
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to delete target');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getProjectName = (projectId: string, targetObj?: Target) => {
    if (targetObj?.project?.name) return targetObj.project.name;
    if (targetObj?.projectName) return targetObj.projectName;
    const found = projects.find((p) => p.id === projectId);
    return found ? found.name : projectId;
  };

  const filteredTargets = targets.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.target.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase());

    const matchesProject =
      selectedProjectId === 'ALL' || t.projectId === selectedProjectId;

    const matchesType =
      selectedType === 'ALL' || t.type === selectedType;

    const matchesStatus =
      selectedStatus === 'ALL' || t.status === selectedStatus;

    return matchesSearch && matchesProject && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Targets"
        description="Configure target IP addresses, hostnames, and domains for local security scanning."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Targets' },
        ]}
        actions={
          <Button
            onClick={() => {
              setActionError(null);
              setShowCreateModal(true);
              createForm.reset({
                name: '',
                target: '',
                type: 'IP_ADDRESS',
                projectId: preselectedProjectId && projects.some((p) => p.id === preselectedProjectId)
                  ? preselectedProjectId
                  : projects.length > 0 ? projects[0].id : '',
              });
            }}
          >
            + Add Target
          </Button>
        }
      />

      {error && (
        <Alert>
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => {
                setLoading(true);
                void fetchData();
              }}
              className="ml-4 underline text-xs hover:text-white"
            >
              Retry
            </button>
          </div>
        </Alert>
      )}

      {actionError && <Alert>{actionError}</Alert>}

      {/* Filter & Search Toolbar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Input
            placeholder="Search targets by name, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Target Types</option>
            <option value="IP_ADDRESS">IP Address</option>
            <option value="HOSTNAME">Hostname</option>
            <option value="DOMAIN">Domain</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Create Target Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold">Create Scan Target</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="space-y-4 text-center py-4">
                <p className="text-sm text-slate-300">
                  You need to create a project before adding a target.
                </p>
                <Link href="/dashboard/projects">
                  <Button>Create a Project First</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-300">
                    Target Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Primary Web Server"
                    {...createForm.register('name')}
                    autoFocus
                  />
                  {createForm.formState.errors.name && (
                    <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-300">
                    Target Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...createForm.register('type')}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="IP_ADDRESS">IP Address (e.g. 192.168.1.100)</option>
                    <option value="HOSTNAME">Hostname (e.g. app-server.local)</option>
                    <option value="DOMAIN">Domain (e.g. target-domain.org)</option>
                  </select>
                  {createForm.formState.errors.type && (
                    <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-300">
                    Target Value (IP / Hostname / Domain) <span className="text-red-400">*</span>
                  </label>
                  <Input
                    placeholder="192.168.1.1 or api.example.local"
                    {...createForm.register('target')}
                  />
                  {createForm.formState.errors.target && (
                    <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.target.message}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-300">
                    Project Scope <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...createForm.register('projectId')}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (/{p.slug})
                      </option>
                    ))}
                  </select>
                  {createForm.formState.errors.projectId && (
                    <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.projectId.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button onClick={createForm.handleSubmit(handleCreate)}>
                    {createForm.formState.isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Spinner />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Target'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Target Modal */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold">Edit Target: {editingTarget.name}</h2>
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
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
                  onClick={() => setEditingTarget(null)}
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
      {deletingTarget && (
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
              Are you sure you want to delete <span className="font-semibold text-white">&ldquo;{deletingTarget.name}&rdquo;</span>?
            </p>
            <p className="text-xs text-slate-400">
              Note: The backend will reject deletion if there are active dependent scan or finding records attached to this target.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingTarget(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Target'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-64 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading targets...</span>
        </div>
      ) : filteredTargets.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">No targets found</p>
            <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
              {targets.length === 0
                ? 'Add your first target system to initiate local security assessments.'
                : 'No targets match your active filters. Try adjusting search terms or filters.'}
            </p>
          </div>
          {targets.length === 0 ? (
            <Button onClick={() => setShowCreateModal(true)}>+ Add Your First Target</Button>
          ) : (
            <button
              onClick={() => {
                setSearch('');
                setSelectedProjectId('ALL');
                setSelectedType('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-xs text-blue-400 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTargets.map((target) => (
            <Card key={target.id}>
              <div className="p-6 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/dashboard/targets/${target.id}`}
                        className="font-bold text-white text-lg hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {target.name}
                      </Link>
                      <p className="font-mono text-xs text-blue-400 mt-0.5 truncate">
                        {target.target}
                      </p>
                    </div>
                    <Badge>{target.type.replace('_', ' ')}</Badge>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Project: <strong className="text-slate-200 font-medium">{getProjectName(target.projectId, target)}</strong>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        target.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {target.status}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/targets/${target.id}`}
                      className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                      Details &rarr;
                    </Link>
                    <span className="text-slate-700">&bull;</span>
                    <Link
                      href={`/dashboard/scans/new?targetId=${target.id}`}
                      className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                      Scan
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(target)}
                      className="rounded px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit target"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingTarget(target)}
                      className="rounded px-2.5 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                      title="Delete target"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TargetsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading targets...</span>
        </div>
      }
    >
      <TargetsPageContent />
    </Suspense>
  );
}
