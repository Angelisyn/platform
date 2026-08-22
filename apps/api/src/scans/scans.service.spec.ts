import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ScansService } from './scans.service';
import { PrismaService } from '../prisma/prisma.service';
import { LocalScannerService } from './local-scanner.service';
import { ScannerParserService } from './scanner-parser.service';
import { ScanExecutionMode, ScanStatus, ScanType } from '@prisma/client';

describe('ScansService', () => {
  let service: ScansService;

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
    target: { name: 'Web Server', target: '192.168.1.100' },
    project: { name: 'My Project' },
    _count: { findings: 0 },
  };

  const mockProject = {
    id: 'proj-1',
    name: 'My Project',
    slug: 'my-project',
    ownerId: 'user-1',
  };

  const mockTarget = {
    id: 'target-1',
    name: 'Web Server',
    target: '192.168.1.100',
    projectId: 'proj-1',
  };

  const mockPrismaService = {
    scan: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
    target: {
      findFirst: jest.fn(),
    },
  };

  const mockLocalScanner = {
    executeScan: jest.fn().mockResolvedValue({
      targetValue: '192.168.1.100',
      scanType: 'PORT_SCAN',
      ports: [],
      rawOutput: 'Done',
      startedAt: new Date(),
      completedAt: new Date(),
    }),
  };

  const mockScannerParser = {
    parseAndPersistFindings: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScansService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LocalScannerService, useValue: mockLocalScanner },
        { provide: ScannerParserService, useValue: mockScannerParser },
      ],
    }).compile();

    service = module.get<ScansService>(ScansService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForUser', () => {
    it('should return all scans owned by user projects', async () => {
      mockPrismaService.scan.findMany.mockResolvedValue([mockScan]);
      const result = await service.findAllForUser('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('scan-1');
      expect(result[0].findingsCount).toBe(0);
    });
  });

  describe('createForUser', () => {
    it('should create scan job in QUEUED status with LOCAL mode', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.target.findFirst.mockResolvedValue(mockTarget);
      mockPrismaService.scan.create.mockResolvedValue(mockScan);
      mockPrismaService.scan.update.mockResolvedValue({
        ...mockScan,
        status: ScanStatus.COMPLETED,
      });

      const dto = {
        name: 'Port Scan Job',
        targetId: 'target-1',
        projectId: 'proj-1',
        scanType: ScanType.PORT_SCAN,
      };

      const result = await service.createForUser('user-1', dto);
      expect(result.status).toBe(ScanStatus.QUEUED);
      expect(result.executionMode).toBe(ScanExecutionMode.LOCAL);
    });

    it('should throw ForbiddenException if project is not owned by user', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      const dto = {
        name: 'Port Scan Job',
        targetId: 'target-1',
        projectId: 'proj-other',
        scanType: ScanType.PORT_SCAN,
      };

      await expect(service.createForUser('user-1', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Prisma P2003 error handling', () => {
    it('should throw BadRequestException on P2003 during createForUser', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.target.findFirst.mockResolvedValue(mockTarget);
      mockPrismaService.scan.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          { code: 'P2003', clientVersion: '5.0.0' },
        ),
      );

      const dto = {
        name: 'Port Scan Job',
        targetId: 'target-1',
        projectId: 'proj-1',
        scanType: ScanType.PORT_SCAN,
      };

      await expect(service.createForUser('user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should re-throw non-P2003 Prisma errors', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.target.findFirst.mockResolvedValue(mockTarget);
      mockPrismaService.scan.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          { code: 'P2002', clientVersion: '5.0.0' },
        ),
      );

      const dto = {
        name: 'Port Scan Job',
        targetId: 'target-1',
        projectId: 'proj-1',
        scanType: ScanType.PORT_SCAN,
      };

      await expect(service.createForUser('user-1', dto)).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
    });
  });
});
