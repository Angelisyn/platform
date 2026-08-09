import { Test, TestingModule } from '@nestjs/testing';
import { FindingsService } from './findings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FindingsService', () => {
  let service: FindingsService;

  const mockFinding = {
    id: 'finding-1',
    title: 'Open Telnet',
    severity: 'HIGH',
    status: 'OPEN',
    targetId: 't-1',
    scanId: 's-1',
    projectId: 'p-1',
    description: 'Telnet open',
    target: { name: 'Target 1', target: '192.168.1.1' },
    scan: { name: 'Scan 1' },
    project: { name: 'Project 1' },
  };

  const mockPrismaService = {
    finding: {
      findMany: jest.fn().mockResolvedValue([mockFinding]),
      findFirst: jest.fn().mockResolvedValue(mockFinding),
    },
    scan: { findFirst: jest.fn().mockResolvedValue({}) },
    target: { findFirst: jest.fn().mockResolvedValue({}) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FindingsService>(FindingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all findings for user', async () => {
    const res = await service.findAllForUser('u-1');
    expect(res).toHaveLength(1);
    expect(res[0].title).toBe('Open Telnet');
  });
});
