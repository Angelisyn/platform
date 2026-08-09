import { Test, TestingModule } from '@nestjs/testing';
import { LocalScannerService } from './local-scanner.service';

describe('LocalScannerService', () => {
  let service: LocalScannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalScannerService],
    }).compile();

    service = module.get<LocalScannerService>(LocalScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should execute scan against localhost and return result object', async () => {
    const result = await service.executeScan('127.0.0.1', 'NETWORK_DISCOVERY');
    expect(result.targetValue).toBe('127.0.0.1');
    expect(result.scanType).toBe('NETWORK_DISCOVERY');
    expect(result.rawOutput).toContain('=== Angelisyn Local Scanner ===');
    expect(Array.isArray(result.ports)).toBe(true);
  });
});
