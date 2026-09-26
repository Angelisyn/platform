import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { projectsService } from '@/services/projects.service';
import { scansService } from '@/services/scans.service';
import { targetsService } from '@/services/targets.service';
import { makeScan } from '@/test/fixtures';
import type { Project } from '@/types/projects';
import type { Target } from '@/types/targets';
import NewScanPage from './page';

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('next/link', () => ({
  default: function MockLink({ href, children, ...rest }: ComponentProps<'a'>) {
    return (
      <a href={typeof href === 'string' ? href : undefined} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock('@/services/targets.service', () => ({
  targetsService: { getAll: vi.fn() },
}));

vi.mock('@/services/projects.service', () => ({
  projectsService: { getAll: vi.fn() },
}));

vi.mock('@/services/scans.service', () => ({
  scansService: { create: vi.fn() },
}));

const getAllTargetsMock = vi.mocked(targetsService.getAll);
const getAllProjectsMock = vi.mocked(projectsService.getAll);
const createMock = vi.mocked(scansService.create);

const target: Target = {
  id: 'target-1',
  name: 'Lab Target',
  target: '10.0.0.1',
  type: 'IP_ADDRESS',
  status: 'ACTIVE',
  projectId: 'project-1',
  createdAt: '2026-09-25T09:00:00.000Z',
};

const project: Project = {
  id: 'project-1',
  name: 'Lab Project',
  slug: 'lab-project',
  ownerId: 'user-1',
  createdAt: '2026-09-25T09:00:00.000Z',
  updatedAt: '2026-09-25T09:00:00.000Z',
};

function selectTarget() {
  const targetSelect = document.querySelector('select[name="targetId"]');
  if (!targetSelect) throw new Error('target select not found');
  fireEvent.change(targetSelect, { target: { value: target.id } });
}

function submitForm() {
  const button = screen.getByRole('button', { name: 'Start Local Scan' });
  const form = button.closest('form');
  if (!form) throw new Error('form not found');
  fireEvent.submit(form);
}

describe('NewScanPage error handling', () => {
  beforeEach(() => {
    pushMock.mockReset();
    createMock.mockReset();
    getAllTargetsMock.mockResolvedValue([target]);
    getAllProjectsMock.mockResolvedValue([project]);
  });

  afterEach(() => {
    cleanup();
  });

  it('shows inline form validation errors without calling the API', async () => {
    render(<NewScanPage />);
    await screen.findByText('Scan Name');

    submitForm();

    expect(await screen.findByText('Target selection is required')).toBeTruthy();
    expect(createMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Invalid scan request')).toBeNull();
    expect(screen.queryByText('Network error — unable to reach the API')).toBeNull();
    expect(screen.queryByText('API error')).toBeNull();
  });

  it('presents a backend validation failure (invalid target) as an invalid-request error', async () => {
    createMock.mockRejectedValue(
      new ApiError(400, 'Target does not exist or does not belong to specified project'),
    );

    render(<NewScanPage />);
    await screen.findByText('Scan Name');
    selectTarget();
    submitForm();

    expect(await screen.findByText('Invalid scan request')).toBeTruthy();
    expect(
      screen.getByText('Target does not exist or does not belong to specified project'),
    ).toBeTruthy();
    expect(screen.queryByText('Network error — unable to reach the API')).toBeNull();
    expect(screen.queryByText('API error')).toBeNull();
  });

  it('presents a network failure distinctly from an API error', async () => {
    createMock.mockRejectedValue(new ApiError(0, 'Network connection failed: fetch failed'));

    render(<NewScanPage />);
    await screen.findByText('Scan Name');
    selectTarget();
    submitForm();

    expect(await screen.findByText('Network error — unable to reach the API')).toBeTruthy();
    expect(screen.getByText('Network connection failed: fetch failed')).toBeTruthy();
    expect(screen.queryByText('Invalid scan request')).toBeNull();
    expect(screen.queryByText('API error')).toBeNull();
  });

  it('presents a server failure as an API error', async () => {
    createMock.mockRejectedValue(new ApiError(500, 'Internal server error'));

    render(<NewScanPage />);
    await screen.findByText('Scan Name');
    selectTarget();
    submitForm();

    expect(await screen.findByText('API error')).toBeTruthy();
    expect(screen.getByText('Internal server error')).toBeTruthy();
    expect(screen.queryByText('Network error — unable to reach the API')).toBeNull();
    expect(screen.queryByText('Invalid scan request')).toBeNull();
  });

  it('navigates to the new scan on successful creation', async () => {
    createMock.mockResolvedValue(makeScan({ id: 'scan-2' }));

    render(<NewScanPage />);
    await screen.findByText('Scan Name');
    selectTarget();
    submitForm();

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard/scans/scan-2'));
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});
