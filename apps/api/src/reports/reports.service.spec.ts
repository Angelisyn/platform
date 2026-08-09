import { Test, TestingModule } from '@nestjs/testing';
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
});
