import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TargetsService } from './targets.service';
import { TargetType } from '@prisma/client';

describe('TargetsService', () => {
  let service: TargetsService;
  let prismaService: PrismaService;

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

  const mockProject = {
    id: 'proj-1',
    name: 'My Project',
    slug: 'my-project',
    ownerId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    target: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TargetsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TargetsService>(TargetsService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForUser', () => {
    it('should return all targets owned by user', async () => {
      mockPrismaService.target.findMany.mockResolvedValue([mockTarget]);
      const result = await service.findAllForUser('user-1');
      expect(result).toEqual([mockTarget]);
      expect(mockPrismaService.target.findMany).toHaveBeenCalledWith({
        where: { project: { ownerId: 'user-1' } },
        include: { project: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOneForUser', () => {
    it('should return target if owned by user', async () => {
      mockPrismaService.target.findFirst.mockResolvedValue(mockTarget);
      const result = await service.findOneForUser('target-1', 'user-1');
      expect(result).toEqual(mockTarget);
    });

    it('should throw NotFoundException if target not found or not owned', async () => {
      mockPrismaService.target.findFirst.mockResolvedValue(null);
      await expect(service.findOneForUser('target-1', 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createForUser', () => {
    it('should create target if project belongs to user', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.target.create.mockResolvedValue(mockTarget);

      const dto = {
        name: 'Web Server',
        target: '192.168.1.100',
        type: TargetType.IP_ADDRESS,
        projectId: 'proj-1',
      };

      const result = await service.createForUser('user-1', dto);
      expect(result).toEqual(mockTarget);
      expect(mockPrismaService.target.create).toHaveBeenCalledWith({
        data: dto,
      });
    });

    it('should throw ForbiddenException if project does not belong to user', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      const dto = {
        name: 'Web Server',
        target: '192.168.1.100',
        type: TargetType.IP_ADDRESS,
        projectId: 'proj-other',
      };

      await expect(service.createForUser('user-1', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
