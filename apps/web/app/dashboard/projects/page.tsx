'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Badge, Button, Card, Input, Spinner } from '@angelisyn/ui';
import { PageHeader } from '@/components/dashboard/page-header';
import { projectsService } from '@/services/projects.service';
import { isApiError } from '@/lib/api';
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectFormValues,
  type UpdateProjectFormValues,
} from '@/lib/validator/projects';
import type { Project } from '@/types/projects';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const createForm = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', slug: '' },
  });

  const editForm = useForm<UpdateProjectFormValues>({
    resolver: zodResolver(updateProjectSchema),
  });

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const data = await projectsService.getAll();
      setProjects(data);
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      try {
        const data = await projectsService.getAll();
        if (isMounted) {
          setProjects(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            isApiError(err)
              ? err.message
              : err instanceof Error
              ? err.message
              : 'Failed to load projects',
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

  const handleNameChangeForCreate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    createForm.setValue('name', val, { shouldValidate: true });
    if (!createForm.formState.dirtyFields.slug) {
      createForm.setValue('slug', slugify(val), { shouldValidate: true });
    }
  };

  const handleCreate = async (values: CreateProjectFormValues) => {
    try {
      setActionError(null);
      await projectsService.create(values);
      createForm.reset({ name: '', slug: '' });
      setShowCreateModal(false);
      await fetchProjects();
    } catch (err) {
      if (isApiError(err)) {
        setActionError(err.message);
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to create project');
      }
    }
  };

  const startEditing = (project: Project) => {
    setActionError(null);
    setEditingProject(project);
    editForm.reset({ name: project.name, slug: project.slug });
  };

  const handleUpdate = async (values: UpdateProjectFormValues) => {
    if (!editingProject) return;
    try {
      setActionError(null);
      await projectsService.update(editingProject.id, values);
      setEditingProject(null);
      await fetchProjects();
    } catch (err) {
      if (isApiError(err)) {
        setActionError(err.message);
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to update project');
      }
    }
  };

  const confirmDelete = async () => {
    if (!deletingProject) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await projectsService.delete(deletingProject.id);
      setDeletingProject(null);
      await fetchProjects();
    } catch (err) {
      if (isApiError(err)) {
        setActionError(err.message);
      } else {
        setActionError(err instanceof Error ? err.message : 'Failed to delete project');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="Organize security assessments, targets, scans, and reports by project scope."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects' },
        ]}
        actions={
          <Button
            onClick={() => {
              setActionError(null);
              setShowCreateModal(true);
              createForm.reset({ name: '', slug: '' });
            }}
          >
            + New Project
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
                void fetchProjects();
              }}
              className="ml-4 underline text-xs hover:text-white"
            >
              Retry
            </button>
          </div>
        </Alert>
      )}

      {actionError && <Alert>{actionError}</Alert>}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold">Create New Project</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-300">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <Input
                  {...createForm.register('name')}
                  onChange={handleNameChangeForCreate}
                  placeholder="e.g. Production Infrastructure"
                  autoFocus
                />
                {createForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-300">
                  Project Slug <span className="text-red-400">*</span>
                </label>
                <Input
                  {...createForm.register('slug')}
                  placeholder="e.g. production-infrastructure"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Used as a URL-friendly identifier. Must be unique per account.
                </p>
                {createForm.formState.errors.slug && (
                  <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.slug.message}</p>
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
                    'Create Project'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold">Edit Project</h2>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
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
                  onClick={() => setEditingProject(null)}
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
      {deletingProject && (
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
              Are you sure you want to delete <span className="font-semibold text-white">&ldquo;{deletingProject.name}&rdquo;</span>?
            </p>
            <p className="text-xs text-slate-400">
              This action is permanent. All targets, scans, findings, and reports associated with this project will be deleted.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProject(null)}
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
                {isDeleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-64 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">No projects yet</p>
            <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
              Create your first project to organize targets, scans, and security assessments.
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            + Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <div className="flex flex-col justify-between p-6 h-full space-y-5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="font-bold text-white text-lg hover:text-blue-400 transition-colors line-clamp-1"
                    >
                      {project.name}
                    </Link>
                    <Badge>Active</Badge>
                  </div>

                  <p className="mt-1 font-mono text-xs text-slate-400">
                    /{project.slug}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1 text-xs text-slate-500">
                    <p>Created {new Date(project.createdAt).toLocaleDateString()}</p>
                    <p className="font-mono text-[11px] text-slate-600 truncate">ID: {project.id}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View Details &rarr;
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(project)}
                      className="rounded px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit project"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingProject(project)}
                      className="rounded px-2.5 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                      title="Delete project"
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
