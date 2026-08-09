import { z } from 'zod';

const validScanTypes = ['NETWORK_DISCOVERY', 'PORT_SCAN', 'VULNERABILITY_SCAN', 'WEB_ASSESSMENT'] as const;

export const createScanSchema = z.object({
  name: z.string().min(2, 'Scan name must be at least 2 characters'),
  projectId: z.string().min(1, 'Project selection is required'),
  targetId: z.string().min(1, 'Target selection is required'),
  scanType: z.enum(validScanTypes, {
    message: 'Select a valid scan type',
  }),
});

export type CreateScanInput = z.infer<typeof createScanSchema>;
