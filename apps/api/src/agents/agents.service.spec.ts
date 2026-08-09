import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentsService } from './agents.service';

describe('AgentsService', () => {
  let service: AgentsService;

  const findManyAgent = jest.fn();
  const findFirstAgent = jest.fn();
  const createAgent = jest.fn();
  const updateAgent = jest.fn();
  const deleteAgent = jest.fn();
  const findFirstProject = jest.fn();

  const prisma = {
    agent: {
      findMany: findManyAgent,
      findFirst: findFirstAgent,
      create: createAgent,
      update: updateAgent,
      delete: deleteAgent,
    },
    project: {
      findFirst: findFirstProject,
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AgentsService(prisma);
  });

  it('should list agents belonging to user projects', async () => {
    findManyAgent.mockResolvedValue([
      {
        id: 'a1',
        name: 'Agent 1',
        provider: 'openai',
        model: 'gpt-4',
        projectId: 'p1',
      },
    ]);

    const result = await service.findAllForUser('user-1');

    expect(findManyAgent).toHaveBeenCalledWith({
      where: { project: { ownerId: 'user-1' } },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toHaveLength(1);
  });

  it('should find one agent owned by user via project', async () => {
    findFirstAgent.mockResolvedValue({
      id: 'a1',
      name: 'Agent 1',
      provider: 'openai',
      model: 'gpt-4',
      projectId: 'p1',
    });

    const result = await service.findOneForUser('a1', 'user-1');

    expect(findFirstAgent).toHaveBeenCalledWith({
      where: { id: 'a1', project: { ownerId: 'user-1' } },
    });
    expect(result.id).toBe('a1');
  });

  it('should throw NotFoundException if agent is missing or owned by another user', async () => {
    findFirstAgent.mockResolvedValue(null);

    await expect(service.findOneForUser('a1', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should create agent when project belongs to user', async () => {
    findFirstProject.mockResolvedValue({ id: 'p1', ownerId: 'user-1' });
    createAgent.mockResolvedValue({
      id: 'a1',
      name: 'Agent 1',
      provider: 'openai',
      model: 'gpt-4',
      projectId: 'p1',
    });

    const dto = {
      name: 'Agent 1',
      provider: 'openai',
      model: 'gpt-4',
      projectId: 'p1',
    };
    const result = await service.createForUser('user-1', dto);

    expect(findFirstProject).toHaveBeenCalledWith({
      where: { id: 'p1', ownerId: 'user-1' },
    });
    expect(createAgent).toHaveBeenCalledWith({ data: dto });
    expect(result.id).toBe('a1');
  });

  it('should reject creating agent when project belongs to another user', async () => {
    findFirstProject.mockResolvedValue(null);

    const dto = {
      name: 'Agent 1',
      provider: 'openai',
      model: 'gpt-4',
      projectId: 'p-other',
    };
    await expect(service.createForUser('user-1', dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should update agent if owned by user', async () => {
    findFirstAgent.mockResolvedValue({
      id: 'a1',
      name: 'Agent 1',
      projectId: 'p1',
    });
    updateAgent.mockResolvedValue({
      id: 'a1',
      name: 'Agent Updated',
      projectId: 'p1',
    });

    const result = await service.updateForUser('a1', 'user-1', {
      name: 'Agent Updated',
    });

    expect(updateAgent).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { name: 'Agent Updated' },
    });
    expect(result.name).toBe('Agent Updated');
  });

  it('should reject updating agent to project owned by another user', async () => {
    findFirstAgent.mockResolvedValue({
      id: 'a1',
      name: 'Agent 1',
      projectId: 'p1',
    });
    findFirstProject.mockResolvedValue(null);

    await expect(
      service.updateForUser('a1', 'user-1', { projectId: 'p-other' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should delete agent if owned by user', async () => {
    findFirstAgent.mockResolvedValue({
      id: 'a1',
      name: 'Agent 1',
      projectId: 'p1',
    });
    deleteAgent.mockResolvedValue({ id: 'a1' });

    await service.removeForUser('a1', 'user-1');

    expect(deleteAgent).toHaveBeenCalledWith({ where: { id: 'a1' } });
  });

  it('should prevent deleting agent owned by another user', async () => {
    findFirstAgent.mockResolvedValue(null);

    await expect(service.removeForUser('a1', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
