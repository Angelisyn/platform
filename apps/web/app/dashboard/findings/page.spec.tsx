import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { findingsService } from '@/services/findings.service';
import type { Finding } from '@/types/findings';
import FindingsPage from './page';

vi.mock('next/link', () => ({
  default: function MockLink({ href, children, ...rest }: ComponentProps<'a'>) {
    return (
      <a href={typeof href === 'string' ? href : undefined} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock('@/services/findings.service', () => ({
  findingsService: { getAll: vi.fn() },
}));

const getAllMock = vi.mocked(findingsService.getAll);

const finding: Finding = {
  id: 'finding-1',
  title: 'Open Service: Port 22/tcp (ssh)',
  severity: 'INFO',
  status: 'OPEN',
  targetId: 'target-1',
  targetName: 'Lab Target',
  scanId: 'scan-1',
  projectId: 'project-1',
  description: 'TCP port 22 is open on target 10.0.0.1.',
  detectedAt: '2026-09-26T10:00:00.000Z',
};

describe('FindingsPage states', () => {
  beforeEach(() => {
    getAllMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the empty state on 200 with []', async () => {
    getAllMock.mockResolvedValue([]);

    render(<FindingsPage />);

    expect(await screen.findByText('No findings detected')).toBeTruthy();
    expect(screen.queryByText('Failed to load findings')).toBeNull();
  });

  it('renders findings on 200 with data', async () => {
    getAllMock.mockResolvedValue([finding]);

    render(<FindingsPage />);

    expect(await screen.findByText(finding.title)).toBeTruthy();
    expect(screen.queryByText('No findings detected')).toBeNull();
  });

  it('renders an error state (not the empty state) on API failure', async () => {
    getAllMock.mockRejectedValue(new ApiError(500, 'Internal server error'));

    render(<FindingsPage />);

    expect(await screen.findByText('Failed to load findings')).toBeTruthy();
    expect(screen.getByText('Internal server error')).toBeTruthy();
    expect(screen.queryByText('No findings detected')).toBeNull();
  });

  it('renders an error state (not the empty state) on 401', async () => {
    getAllMock.mockRejectedValue(new ApiError(401, 'Unauthorized'));

    render(<FindingsPage />);

    expect(await screen.findByText('Failed to load findings')).toBeTruthy();
    expect(screen.getByText('Unauthorized')).toBeTruthy();
    expect(screen.queryByText('No findings detected')).toBeNull();
  });

  it('renders a network-specific error state on network failure', async () => {
    getAllMock.mockRejectedValue(new ApiError(0, 'Network connection failed: fetch failed'));

    render(<FindingsPage />);

    expect(await screen.findByText('Failed to load findings')).toBeTruthy();
    expect(screen.getByText('Network connection failed: fetch failed')).toBeTruthy();
    expect(screen.queryByText('No findings detected')).toBeNull();
  });

  it('recovers through the Retry action', async () => {
    getAllMock.mockRejectedValueOnce(new ApiError(500, 'Internal server error'));

    render(<FindingsPage />);
    await screen.findByText('Failed to load findings');

    getAllMock.mockResolvedValueOnce([finding]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText(finding.title)).toBeTruthy();
    expect(screen.queryByText('Failed to load findings')).toBeNull();
    expect(screen.queryByText('No findings detected')).toBeNull();
  });
});
