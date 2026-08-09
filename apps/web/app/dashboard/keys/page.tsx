'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Badge, Button, Card, Heading, Input, Spinner } from '@angelisyn/ui';
import { getSupportedProviders } from '@angelisyn/types';
import { apiKeysService } from '@/services/api-keys.service';
import { createApiKeySchema, type CreateApiKeyFormValues } from '@/lib/validator/api-keys';
import type { ApiKey } from '@/types/api-keys';

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const createForm = useForm<CreateApiKeyFormValues>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: { name: '', provider: '', key: '' },
  });

  useEffect(() => {
    let isMounted = true;

    async function loadKeys() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiKeysService.getAll();
        if (isMounted) {
          setKeys(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load API keys',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadKeys();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshKeys = async () => {
    try {
      const data = await apiKeysService.getAll();
      setKeys(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to reload API keys',
      );
    }
  };

  const handleCreate = async (values: CreateApiKeyFormValues) => {
    try {
      setActionError(null);
      await apiKeysService.create(values);
      createForm.reset();
      setShowCreateForm(false);
      await refreshKeys();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to create API key',
      );
    }
  };

  const handleDelete = async (id: string, nameOrProvider: string) => {
    if (
      !window.confirm(
        `Are you sure you want to revoke API key "${nameOrProvider}"?`,
      )
    ) {
      return;
    }
    try {
      setActionError(null);
      await apiKeysService.delete(id);
      await refreshKeys();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to delete API key',
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading>API Keys</Heading>
          <p className="mt-1 text-sm text-slate-400">
            Manage third-party LLM provider API credentials.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Add API Key'}
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}

      {showCreateForm && (
        <Card>
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Add New API Key
            </h2>
            <form
              onSubmit={createForm.handleSubmit(handleCreate)}
              className="space-y-4 max-w-md"
            >
              <div>
                <label className="block mb-1 text-sm text-slate-300">
                  Key Name (Optional)
                </label>
                <Input
                  {...createForm.register('name')}
                  placeholder="My OpenAI Key"
                />
                {createForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-400">
                    {createForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-300">
                  Provider
                </label>
                <select
                  {...createForm.register('provider')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a provider</option>
                  {getSupportedProviders().map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {createForm.formState.errors.provider && (
                  <p className="mt-1 text-xs text-red-400">
                    {createForm.formState.errors.provider.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-300">
                  API Key Secret
                </label>
                <Input
                  type="password"
                  {...createForm.register('key')}
                  placeholder="sk-..."
                />
                {createForm.formState.errors.key && (
                  <p className="mt-1 text-xs text-red-400">
                    {createForm.formState.errors.key.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={createForm.handleSubmit(handleCreate)}>
                  {createForm.formState.isSubmitting
                    ? 'Saving...'
                    : 'Save API Key'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-3">
          <Spinner />
          <span className="text-slate-400">Loading API keys...</span>
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-400">
          <p className="text-lg font-medium text-slate-300">
            No API keys configured
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Add an API key for OpenAI to connect agents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {keys.map((keyItem) => (
            <Card key={keyItem.id}>
              <div className="flex flex-col justify-between p-6 h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-lg">
                      {keyItem.name || keyItem.provider}
                    </h3>
                    <Badge>{keyItem.provider}</Badge>
                  </div>
                  <p className="mt-2 text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 inline-block">
                    {keyItem.keyMasked}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    Created {new Date(keyItem.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Updated {new Date(keyItem.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    onClick={() =>
                      handleDelete(keyItem.id, keyItem.name || keyItem.provider)
                    }
                    className="rounded px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-slate-800"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
