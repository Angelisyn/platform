import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { ProviderAdapterService } from './providers/provider-adapter.service';
import { AgentsService } from './agents.service';

describe('AgentsService', () => {
  let service: AgentsService;

  const findManyAgent = jest.fn();
  const findFirstAgent = jest.fn();
  const createAgent = jest.fn();
  const updateAgent = jest.fn();
  const deleteAgent = jest.fn();
  const findFirstProject = jest.fn();

  const getDecryptedKeyByProviderForUser = jest.fn();
  const executeAdapter = jest.fn();

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

  const apiKeysService = {
    getDecryptedKeyByProviderForUser,
  } as unknown as ApiKeysService;

  const providerAdapterService = {
    execute: executeAdapter,
  } as unknown as ProviderAdapterService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AgentsService(prisma, apiKeysService, providerAdapterService);
  });

  it('should list agents belonging to user projects', async () => {
    findManyAgent.mockResolvedValue([
      {
        id: 'a1',
        name: 'Agent 1',
        provider: 'openai',
        model: 'gpt-4o',
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
      model: 'gpt-4o',
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

  it('should create agent when project belongs to user and provider/model are valid', async () => {
    findFirstProject.mockResolvedValue({ id: 'p1', ownerId: 'user-1' });
    createAgent.mockResolvedValue({
      id: 'a1',
      name: 'Agent 1',
      provider: 'openai',
      model: 'gpt-4o',
      projectId: 'p1',
    });

    const dto = {
      name: 'Agent 1',
      provider: 'openai',
      model: 'gpt-4o',
      projectId: 'p1',
    };
    const result = await service.createForUser('user-1', dto);

    expect(findFirstProject).toHaveBeenCalledWith({
      where: { id: 'p1', ownerId: 'user-1' },
    });
    expect(createAgent).toHaveBeenCalledWith({ data: dto });
    expect(result.id).toBe('a1');
  });

  it('should reject creating agent when provider is invalid', async () => {
    const dto = {
      name: 'Agent 1',
      provider: 'open',
      model: 'gpt-4o',
      projectId: 'p1',
    };
    await expect(service.createForUser('user-1', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should reject creating agent when model is invalid for provider', async () => {
    const dto = {
      name: 'Agent 1',
      provider: 'openai',
      model: 'gpt',
      projectId: 'p1',
    };
    await expect(service.createForUser('user-1', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should reject creating agent when project belongs to another user', async () => {
    findFirstProject.mockResolvedValue(null);

    const dto = {
      name: 'Agent 1',
      provider: 'openai',
      model: 'gpt-4o',
      projectId: 'p-other',
    };
    await expect(service.createForUser('user-1', dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should update agent if owned by user and provider/model are valid', async () => {
    findFirstAgent.mockResolvedValue({
      id: 'a1',
      name: 'Agent 1',
      provider: 'openai',
      model: 'gpt-4',
      projectId: 'p1',
    });
    updateAgent.mockResolvedValue({
      id: 'a1',
      name: 'Agent Updated',
      provider: 'openai',
      model: 'gpt-4o',
      projectId: 'p1',
    });

    const result = await service.updateForUser('a1', 'user-1', {
      model: 'gpt-4o',
    });

    expect(result.model).toBe('gpt-4o');
  });

  it('should reject updating agent with invalid model', async () => {
    findFirstAgent.mockResolvedValue({
      id: 'a1',
      name: 'Agent 1',
      provider: 'openai',
      model: 'gpt-4o',
      projectId: 'p1',
    });

    await expect(
      service.updateForUser('a1', 'user-1', { model: 'invalid-model' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject updating agent to project owned by another user', async () => {
    findFirstAgent.mockResolvedValue({
      id: 'a1',
      name: 'Agent 1',
      provider: 'openai',
      model: 'gpt-4o',
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

  describe('Prisma P2003 error handling', () => {
    it('should throw BadRequestException on P2003 during createForUser', async () => {
      findFirstProject.mockResolvedValue({ id: 'p1', ownerId: 'user-1' });
      createAgent.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          { code: 'P2003', clientVersion: '5.0.0' },
        ),
      );

      const dto = {
        name: 'Agent 1',
        provider: 'openai',
        model: 'gpt-4o',
        projectId: 'p1',
      };
      await expect(service.createForUser('user-1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw BadRequestException on P2003 during updateForUser', async () => {
      findFirstAgent.mockResolvedValue({
        id: 'a1',
        name: 'Agent 1',
        provider: 'openai',
        model: 'gpt-4o',
        projectId: 'p1',
      });
      findFirstProject.mockResolvedValue({ id: 'p2', ownerId: 'user-1' });
      updateAgent.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          { code: 'P2003', clientVersion: '5.0.0' },
        ),
      );

      await expect(
        service.updateForUser('a1', 'user-1', { projectId: 'p2' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException on P2003 during removeForUser', async () => {
      findFirstAgent.mockResolvedValue({
        id: 'a1',
        name: 'Agent 1',
        projectId: 'p1',
      });
      deleteAgent.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          { code: 'P2003', clientVersion: '5.0.0' },
        ),
      );

      await expect(service.removeForUser('a1', 'user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should re-throw non-P2003 Prisma errors', async () => {
      findFirstProject.mockResolvedValue({ id: 'p1', ownerId: 'user-1' });
      createAgent.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          { code: 'P2002', clientVersion: '5.0.0' },
        ),
      );

      const dto = {
        name: 'Agent 1',
        provider: 'openai',
        model: 'gpt-4o',
        projectId: 'p1',
      };
      await expect(service.createForUser('user-1', dto)).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
    });
  });

  describe('executeForUser', () => {
    it('should successfully execute agent with mocked adapter and return safe output without credentials', async () => {
      findFirstAgent.mockResolvedValue({
        id: 'a1',
        name: 'OpenAI Agent',
        provider: 'openai',
        model: 'gpt-4o',
        projectId: 'p1',
      });
      getDecryptedKeyByProviderForUser.mockResolvedValue('sk-decrypted-secret');
      executeAdapter.mockResolvedValue({ output: 'Hello from LLM' });

      const response = await service.executeForUser('a1', 'user-1', {
        prompt: 'Hi agent',
      });

      expect(getDecryptedKeyByProviderForUser).toHaveBeenCalledWith(
        'user-1',
        'openai',
      );
      expect(executeAdapter).toHaveBeenCalledWith({
        provider: 'openai',
        model: 'gpt-4o',
        prompt: 'Hi agent',
        apiKey: 'sk-decrypted-secret',
      });
      expect(response).toEqual({
        output: 'Hello from LLM',
        provider: 'openai',
        model: 'gpt-4o',
      });
      expect('apiKey' in response).toBe(false);
      expect('key' in response).toBe(false);
    });

    it('should safely reject execution if persisted agent has an invalid model like "gpt"', async () => {
      findFirstAgent.mockResolvedValue({
        id: 'a1',
        name: 'Invalid Model Agent',
        provider: 'openai',
        model: 'gpt',
        projectId: 'p1',
      });

      await expect(
        service.executeForUser('a1', 'user-1', { prompt: 'Hi agent' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException when executing an unowned or nonexistent agent', async () => {
      findFirstAgent.mockResolvedValue(null);

      await expect(
        service.executeForUser('a1', 'user-2', { prompt: 'Hi agent' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException if user has no API key for provider', async () => {
      findFirstAgent.mockResolvedValue({
        id: 'a1',
        name: 'OpenAI Agent',
        provider: 'openai',
        model: 'gpt-4o',
        projectId: 'p1',
      });
      getDecryptedKeyByProviderForUser.mockRejectedValue(
        new BadRequestException("No API key configured for provider 'openai'"),
      );

      await expect(
        service.executeForUser('a1', 'user-1', { prompt: 'Hi' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if provider is unsupported', async () => {
      findFirstAgent.mockResolvedValue({
        id: 'a1',
        name: 'Custom Agent',
        provider: 'unsupported-provider',
        model: 'custom-model',
        projectId: 'p1',
      });

      await expect(
        service.executeForUser('a1', 'user-1', { prompt: 'Hi' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
