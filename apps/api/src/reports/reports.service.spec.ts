import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockReport = {
    id: 'r-1',
    name: 'Q3 Report',
    projectId: 'p-1',
    status: 'READY',
    createdAt: new Date(),
    project: { name: 'Project 1' },
  };

  const mockPrismaService = {
    report: {
      findMany: jest.fn().mockResolvedValue([mockReport]),
      findFirst: jest.fn().mockResolvedValue(mockReport),
      create: jest.fn().mockResolvedValue(mockReport),
    },
    project: { findFirst: jest.fn().mockResolvedValue({ name: 'Project 1' }) },
    finding: {
      groupBy: jest.fn().mockResolvedValue([{ severity: 'HIGH', _count: { severity: 2 } }]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all reports with findings summary', async () => {
    const res = await service.findAllForUser('u-1');
    expect(res).toHaveLength(1);
    expect(res[0].findingsSummary.high).toBe(2);
  });

  describe('Prisma P2003 error handling', () => {
    it('should throw ForbiddenException when project does not belong to user', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(
        service.createForUser('u-1', {
          name: 'Report',
          projectId: 'p-missing',
          targetId: 't-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException on P2003 during createForUser', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue({ name: 'Project 1' });
      mockPrismaService.report.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          { code: 'P2003', clientVersion: '5.0.0' },
        ),
      );

      await expect(
        service.createForUser('u-1', {
          name: 'Report',
          projectId: 'p-1',
          targetId: 't-missing',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should re-throw non-P2003 Prisma errors', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue({ name: 'Project 1' });
      mockPrismaService.report.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          { code: 'P2002', clientVersion: '5.0.0' },
        ),
      );

      await expect(
        service.createForUser('u-1', {
          name: 'Report',
          projectId: 'p-1',
          targetId: 't-1',
        }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });
  });
});
