import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { scansService } from '@/services/scans.service';
import { makeScan } from '@/test/fixtures';
import ScansPage from './page';

vi.mock('next/link', () => ({
  default: function MockLink({ href, children, ...rest }: ComponentProps<'a'>) {
    return (
      <a href={typeof href === 'string' ? href : undefined} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock('@/services/scans.service', () => ({
  scansService: { getAll: vi.fn() },
}));

const getAllMock = vi.mocked(scansService.getAll);

describe('ScansPage states', () => {
  beforeEach(() => {
    getAllMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a loading state while scans are loading', () => {
    getAllMock.mockReturnValue(new Promise(() => {}));

    render(<ScansPage />);

    expect(screen.getByText('Loading scans...')).toBeTruthy();
  });

  it('renders the empty state on 200 with []', async () => {
    getAllMock.mockResolvedValue([]);

    render(<ScansPage />);

    expect(await screen.findByText('No scans found')).toBeTruthy();
    expect(screen.queryByText('Failed to load scans')).toBeNull();
  });

  it('renders scans on 200 with data', async () => {
    getAllMock.mockResolvedValue([makeScan()]);

    render(<ScansPage />);

    expect(await screen.findByText('Test Scan')).toBeTruthy();
    expect(screen.queryByText('No scans found')).toBeNull();
    expect(screen.queryByText('Failed to load scans')).toBeNull();
  });

  it('renders an error state (not the empty state) on 500', async () => {
    getAllMock.mockRejectedValue(new ApiError(500, 'Internal server error'));

    render(<ScansPage />);

    expect(await screen.findByText('Failed to load scans')).toBeTruthy();
    expect(screen.getByText('Internal server error')).toBeTruthy();
    expect(screen.queryByText('No scans found')).toBeNull();
  });

  it('renders an error state on 401', async () => {
    getAllMock.mockRejectedValue(new ApiError(401, 'Unauthorized'));

    render(<ScansPage />);

    expect(await screen.findByText('Failed to load scans')).toBeTruthy();
    expect(screen.getByText('Unauthorized')).toBeTruthy();
    expect(screen.queryByText('No scans found')).toBeNull();
  });

  it('renders a network-specific error state on network failure', async () => {
    getAllMock.mockRejectedValue(
      new ApiError(0, 'Network connection failed: fetch failed'),
    );

    render(<ScansPage />);

    expect(await screen.findByText('Failed to load scans')).toBeTruthy();
    expect(screen.getByText('Network connection failed: fetch failed')).toBeTruthy();
    expect(screen.queryByText('No scans found')).toBeNull();
  });

  it('recovers through the Retry action', async () => {
    getAllMock.mockRejectedValueOnce(new ApiError(500, 'Internal server error'));

    render(<ScansPage />);
    await screen.findByText('Failed to load scans');

    getAllMock.mockResolvedValueOnce([makeScan()]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Test Scan')).toBeTruthy();
    expect(screen.queryByText('Failed to load scans')).toBeNull();
  });
});
