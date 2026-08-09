import { Test, TestingModule } from '@nestjs/testing';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';
import { ScansService } from '../scans/scans.service';
import { FindingsService } from '../findings/findings.service';
import { TargetType } from '@prisma/client';

describe('TargetsController', () => {
  let controller: TargetsController;

  const mockTarget = {
    id: 'target-1',
    name: 'Web Server',
    target: '192.168.1.100',
    type: TargetType.IP_ADDRESS,
    status: 'ACTIVE',
    projectId: 'proj-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTargetsService = {
    findAllForUser: jest.fn(),
    findOneForUser: jest.fn(),
    createForUser: jest.fn(),
    updateForUser: jest.fn(),
    removeForUser: jest.fn(),
  };

  const mockScansService = {
    findByTargetForUser: jest.fn(),
  };

  const mockFindingsService = {
    findByTargetForUser: jest.fn(),
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
      controllers: [TargetsController],
      providers: [
        { provide: TargetsService, useValue: mockTargetsService },
        { provide: ScansService, useValue: mockScansService },
        { provide: FindingsService, useValue: mockFindingsService },
      ],
    }).compile();

    controller = module.get<TargetsController>(TargetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all targets for current user', async () => {
      mockTargetsService.findAllForUser.mockResolvedValue([mockTarget]);
      const result = await controller.findAll(mockUser);
      expect(result).toEqual([mockTarget]);
    });
  });
});
