'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Badge, Button, Card, Input, Spinner } from '@angelisyn/ui';
import { PageHeader } from '@/components/dashboard/page-header';
import { projectsService } from '@/services/projects.service';
import { targetsService } from '@/services/targets.service';
import { isApiError } from '@/lib/api';
import {
  updateProjectSchema,
  type UpdateProjectFormValues,
} from '@/lib/validator/projects';
import type { Project } from '@/types/projects';
import type { Target } from '@/types/targets';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const [targets, setTargets] = useState<Target[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [targetsError, setTargetsError] = useState<string | null>(null);

  const editForm = useForm<UpdateProjectFormValues>({
    resolver: zodResolver(updateProjectSchema),
  });

  const fetchTargets = useCallback(async (projectId: string) => {
    try {
      setTargetsError(null);
      const data = await targetsService.getByProject(projectId);
      setTargets(data);
    } catch (err) {
      setTargets([]);
      if (isApiError(err)) {
        setTargetsError(err.message);
      } else {
        setTargetsError(err instanceof Error ? err.message : 'Failed to load targets');
      }
    } finally {
      setTargetsLoading(false);
    }
  }, []);

  useEffect(() => {
    setTargetsLoading(true);
    void fetchTargets(id);
  }, [id, fetchTargets]);

  const fetchProject = useCallback(async (projectId: string) => {
    try {
      setError(null);
      setIsNotFound(false);
      const data = await projectsService.getById(projectId);
      setProject(data);
      editForm.reset({ name: data.name, slug: data.slug });
    } catch (err) {
      if (isApiError(err)) {
        if (err.isNotFound) {
          setIsNotFound(true);
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load project details');
      }
    } finally {
      setLoading(false);
    }
  }, [editForm]);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      try {
        const data = await projectsService.getById(id);
        if (isMounted) {
          setProject(data);
          editForm.reset({ name: data.name, slug: data.slug });
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
                : 'Failed to load project details',
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

  const handleUpdate = async (values: UpdateProjectFormValues) => {
    if (!project) return;
    try {
      setActionError(null);
      const updated = await projectsService.update(project.id, values);
      setProject(updated);
      setShowEditModal(false);
    } catch (err) {
      if (isApiError(err)) {
        setActionError(err.message);
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to update project');
      }
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await projectsService.delete(project.id);
      router.push('/dashboard/projects');
    } catch (err) {
      if (isApiError(err)) {
        setActionError(err.message);
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to delete project');
      }
      setIsDeleting(false);
    }
  };

  const copyIdToClipboard = async () => {
    if (!project) return;
    try {
      await navigator.clipboard.writeText(project.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Spinner />
        <span className="text-slate-400">Loading project details...</span>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project Not Found"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Projects', href: '/dashboard/projects' },
            { label: 'Not Found' },
          ]}
        />
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400 space-y-4">
          <p className="text-lg font-semibold text-white">Project Not Found</p>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            The project you are looking for does not exist or you do not have permission to view it.
          </p>
          <Link href="/dashboard/projects">
            <Button>&larr; Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Error Loading Project"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Projects', href: '/dashboard/projects' },
            { label: 'Error' },
          ]}
        />
        <Alert>
          <div className="flex items-center justify-between">
            <span>{error || 'An unexpected error occurred'}</span>
            <button
              onClick={() => {
                setLoading(true);
                void fetchProject(id);
              }}
              className="ml-4 underline text-xs hover:text-white"
            >
              Retry
            </button>
          </div>
        </Alert>
        <Link href="/dashboard/projects" className="inline-block text-sm text-blue-400 hover:underline">
          &larr; Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        description={`Organized scope under identifier /${project.slug}`}
        badge={<Badge>Active Project</Badge>}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects', href: '/dashboard/projects' },
          { label: project.name },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/dashboard/projects">
              <button className="rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">
                &larr; Projects
              </button>
            </Link>
            <Button onClick={() => { setActionError(null); setShowEditModal(true); }}>
              Edit Project
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold">Edit Project</h2>
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
                  Project Name
                </label>
                <Input {...editForm.register('name')} />
                {editForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">{editForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-300">
                  Project Slug
                </label>
                <Input {...editForm.register('slug')} />
                {editForm.formState.errors.slug && (
                  <p className="mt-1 text-xs text-red-400">{editForm.formState.errors.slug.message}</p>
                )}
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-red-900/50 bg-slate-950 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-full bg-red-950/80 border border-red-800/80">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">Delete Project</h2>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-white">&ldquo;{project.name}&rdquo;</span>?
            </p>
            <p className="text-xs text-slate-400">
              This action is permanent and will remove all associated targets, scans, and security findings.
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
                {isDeleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Meta Information Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-slate-800 pb-3">
              Project Information
            </h3>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Name</dt>
                <dd className="font-medium text-white">{project.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Slug</dt>
                <dd className="font-mono text-xs text-blue-400">/{project.slug}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Project ID</dt>
                <dd className="flex items-center gap-2 font-mono text-xs text-slate-300">
                  <span className="truncate max-w-[180px]">{project.id}</span>
                  <button
                    onClick={() => void copyIdToClipboard()}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    {copiedId ? 'Copied!' : 'Copy'}
                  </button>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Owner ID</dt>
                <dd className="font-mono text-xs text-slate-300 truncate max-w-[180px]">
                  {project.ownerId}
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-slate-800 pb-3">
              Audit & Timestamps
            </h3>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Created At</dt>
                <dd className="font-medium text-slate-200">
                  {new Date(project.createdAt).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Last Updated</dt>
                <dd className="font-medium text-slate-200">
                  {new Date(project.updatedAt).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Status</dt>
                <dd>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                    Operational
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>

      {/* Targets in this Project */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Targets ({targets.length})</h2>
          <div className="flex items-center gap-4 text-xs">
            <Link
              href={`/dashboard/targets?projectId=${project.id}`}
              className="text-blue-400 hover:underline font-medium"
            >
              + Create Target
            </Link>
            <Link href="/dashboard/targets" className="text-slate-400 hover:text-white underline">
              View Targets
            </Link>
          </div>
        </div>

        {targetsLoading ? (
          <div className="flex h-32 items-center justify-center gap-3">
            <Spinner />
            <span className="text-slate-400">Loading targets...</span>
          </div>
        ) : targetsError ? (
          <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-8 text-center space-y-4">
            <p className="text-sm font-semibold text-white">Failed to load targets</p>
            <p className="text-sm text-red-300">{targetsError}</p>
            <button
              onClick={() => {
                setTargetsLoading(true);
                void fetchTargets(id);
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-medium text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        ) : targets.length === 0 ? (
          <Card>
            <div className="p-8 text-center text-slate-400 space-y-3">
              <p className="text-sm">No targets have been added to this project yet.</p>
              <Link href={`/dashboard/targets?projectId=${project.id}`}>
                <Button>Add First Target</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {targets.map((target) => (
              <Card key={target.id}>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <Link
                      href={`/dashboard/targets/${target.id}`}
                      className="font-semibold text-white hover:text-blue-400 transition-colors"
                    >
                      {target.name}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <span className="font-mono text-blue-400">{target.target}</span> &bull; Type:{' '}
                      {target.type}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      target.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-400/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {target.status}
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
