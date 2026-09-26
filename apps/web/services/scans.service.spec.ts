import { afterEach, describe, expect, it, vi } from 'vitest';
import { isApiError } from '@/lib/api';
import { env } from '@/lib/config';
import { jsonResponse, makeScan } from '@/test/fixtures';
import { ScansService } from './scans.service';

/**
 * Failure matrix for the scan service: API/network failures must propagate as
 * ApiError instead of being swallowed into []/null.
 */
describe('ScansService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getAll', () => {
    it('resolves with scans on 200 with data', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, [makeScan()]));
      vi.stubGlobal('fetch', fetchMock);

      const result = await new ScansService().getAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('scan-1');
      expect(fetchMock).toHaveBeenCalledWith(`${env.apiUrl}/scans`, expect.anything());
    });

    it('resolves with an empty array on 200 with [] (empty success)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, [])));

      await expect(new ScansService().getAll()).resolves.toEqual([]);
    });

    it('throws ApiError on 401', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse(401, { message: 'Unauthorized' }, 'Unauthorized')),
      );

      const err = await new ScansService().getAll().then(
        () => null,
        (e: unknown) => e,
      );
      expect(isApiError(err)).toBe(true);
      expect(err).toMatchObject({ status: 401, message: 'Unauthorized' });
    });

    it('throws ApiError on 403', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse(403, { message: 'Forbidden' }, 'Forbidden')),
      );

      await expect(new ScansService().getAll()).rejects.toMatchObject({
        name: 'ApiError',
        status: 403,
        message: 'Forbidden',
      });
    });

    it('throws ApiError on 500 instead of returning []', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse(500, { message: 'Internal server error' }, 'Internal Server Error')),
      );

      await expect(new ScansService().getAll()).rejects.toMatchObject({
        name: 'ApiError',
        status: 500,
        message: 'Internal server error',
      });
    });

    it('throws ApiError(0) on network failure instead of returning []', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

      await expect(new ScansService().getAll()).rejects.toMatchObject({
        name: 'ApiError',
        status: 0,
        message: expect.stringContaining('Network connection failed'),
      });
    });
  });

  describe('getById', () => {
    it('resolves with the scan on 200', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, makeScan())));

      const result = await new ScansService().getById('scan-1');
      expect(result.id).toBe('scan-1');
    });

    it('throws ApiError 404 instead of resolving null', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse(404, { message: 'Scan job not found' }, 'Not Found')),
      );

      const err = await new ScansService().getById('missing').then(
        () => null,
        (e: unknown) => e,
      );
      expect(err).not.toBeNull();
      expect(err).not.toBeNull();
      expect(isApiError(err)).toBe(true);
      expect(err).toMatchObject({ status: 404, message: 'Scan job not found' });
    });

    it('throws ApiError 500 instead of resolving null', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse(500, { message: 'Internal server error' }, 'Internal Server Error')),
      );

      await expect(new ScansService().getById('scan-1')).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('getByTarget', () => {
    it('resolves with an empty array on 200 with [] (empty success)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, [])));

      await expect(new ScansService().getByTarget('target-1')).resolves.toEqual([]);
    });

    it('throws ApiError on 500 instead of returning []', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse(500, { message: 'Internal server error' }, 'Internal Server Error')),
      );

      await expect(new ScansService().getByTarget('target-1')).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('create', () => {
    const request = {
      name: 'New Scan',
      targetId: 'target-1',
      projectId: 'project-1',
      scanType: 'PORT_SCAN',
    } as const;

    it('resolves with the created scan on success', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, makeScan({ id: 'scan-2' })));
      vi.stubGlobal('fetch', fetchMock);

      const result = await new ScansService().create(request);

      expect(result.id).toBe('scan-2');
      expect(fetchMock).toHaveBeenCalledWith(
        `${env.apiUrl}/scans`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('propagates backend validation failure (400)', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          jsonResponse(
            400,
            { message: 'Target does not exist or does not belong to specified project' },
            'Bad Request',
          ),
        ),
      );

      await expect(new ScansService().create(request)).rejects.toMatchObject({
        status: 400,
        message: 'Target does not exist or does not belong to specified project',
      });
    });

    it('propagates network failure as ApiError(0)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

      await expect(new ScansService().create(request)).rejects.toMatchObject({
        name: 'ApiError',
        status: 0,
      });
    });
  });

  describe('cancel', () => {
    it('resolves on success', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse(201, makeScan({ status: 'FAILED' }))),
      );

      await expect(new ScansService().cancel('scan-1')).resolves.toBeUndefined();
    });

    it('propagates a 400 when the scan is already terminal', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            jsonResponse(400, { message: 'Cannot cancel scan in COMPLETED state' }, 'Bad Request'),
          ),
      );

      await expect(new ScansService().cancel('scan-1')).rejects.toMatchObject({
        status: 400,
        message: 'Cannot cancel scan in COMPLETED state',
      });
    });
  });
});
