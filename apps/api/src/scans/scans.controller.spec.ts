import { Test, TestingModule } from '@nestjs/testing';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';
import { FindingsService } from '../findings/findings.service';
import { ScanExecutionMode, ScanStatus, ScanType } from '@prisma/client';

describe('ScansController', () => {
  let controller: ScansController;

  const mockScan = {
    id: 'scan-1',
    name: 'Port Scan Job',
    scanType: ScanType.PORT_SCAN,
    executionMode: ScanExecutionMode.LOCAL,
    scanner: 'Local Process Engine',
    status: ScanStatus.QUEUED,
    projectId: 'proj-1',
    targetId: 'target-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    findingsCount: 0,
  };

  const mockScansService = {
    findAllForUser: jest.fn(),
    findOneForUser: jest.fn(),
    createForUser: jest.fn(),
    cancelForUser: jest.fn(),
  };

  const mockFindingsService = {
    findByScanForUser: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScansController],
      providers: [
        { provide: ScansService, useValue: mockScansService },
        { provide: FindingsService, useValue: mockFindingsService },
      ],
    }).compile();

    controller = module.get<ScansController>(ScansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all scans for user', async () => {
      mockScansService.findAllForUser.mockResolvedValue([mockScan]);
      const result = await controller.findAll(mockUser);
      expect(result).toEqual([mockScan]);
    });
  });
});
