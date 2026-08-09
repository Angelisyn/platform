import { Test, TestingModule } from '@nestjs/testing';
import { ScannerParserService } from './scanner-parser.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ScannerParserService', () => {
  let service: ScannerParserService;

  const mockPrismaService = {
    finding: {
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScannerParserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ScannerParserService>(ScannerParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate Telnet finding for open port 23', async () => {
    const scanResult = {
      targetValue: '192.168.1.1',
      scanType: 'PORT_SCAN',
      ports: [{ port: 23, state: 'open' as const, service: 'telnet' }],
      rawOutput: 'Port 23 open',
      startedAt: new Date(),
      completedAt: new Date(),
    };

    const count = await service.parseAndPersistFindings(
      scanResult,
      'scan-1',
      'target-1',
      'proj-1',
    );

    expect(count).toBeGreaterThan(0);
    expect(mockPrismaService.finding.createMany).toHaveBeenCalled();
  });
});
