import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { ProviderAdapterService } from './providers/provider-adapter.service';
import {
  isValidModel,
  isValidProvider,
} from '../common/providers/provider-registry';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { ExecuteAgentDto } from './dto/execute-agent.dto';
import { AgentExecutionResponseDto } from './dto/agent-execution-response.dto';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeysService: ApiKeysService,
    private readonly providerAdapterService: ProviderAdapterService,
  ) {}

  async findAllForUser(userId: string) {
    return this.prisma.agent.findMany({
      where: {
        project: { ownerId: userId },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(id: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: {
        id,
        project: { ownerId: userId },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  async createForUser(userId: string, dto: CreateAgentDto) {
    const canonicalProvider = dto.provider.toLowerCase().trim();
    if (!isValidProvider(canonicalProvider)) {
      throw new BadRequestException(`Unsupported provider '${dto.provider}'.`);
    }
    if (!isValidModel(canonicalProvider, dto.model)) {
      throw new BadRequestException(
        `Model '${dto.model}' is not supported for provider '${dto.provider}'.`,
      );
    }

    const project = await this.prisma.project.findFirst({
      where: {
        id: dto.projectId,
        ownerId: userId,
      },
    });

    if (!project) {
      throw new ForbiddenException(
        'You do not have permission to add agents to this project',
      );
    }

    return this.prisma.agent.create({
      data: {
        ...dto,
        provider: canonicalProvider,
        model: dto.model.trim(),
      },
    });
  }

  async updateForUser(id: string, userId: string, dto: UpdateAgentDto) {
    const existing = await this.findOneForUser(id, userId);

    const targetProvider = dto.provider
      ? dto.provider.toLowerCase().trim()
      : existing.provider;
    const targetModel = dto.model ? dto.model.trim() : existing.model;

    if (dto.provider && !isValidProvider(targetProvider)) {
      throw new BadRequestException(`Unsupported provider '${dto.provider}'.`);
    }
    if (
      (dto.provider || dto.model) &&
      !isValidModel(targetProvider, targetModel)
    ) {
      throw new BadRequestException(
        `Model '${targetModel}' is not supported for provider '${targetProvider}'.`,
      );
    }

    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: {
          id: dto.projectId,
          ownerId: userId,
        },
      });

      if (!project) {
        throw new ForbiddenException(
          'You do not have permission to move agents to this project',
        );
      }
    }

    return this.prisma.agent.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.provider ? { provider: targetProvider } : {}),
        ...(dto.model ? { model: targetModel } : {}),
      },
    });
  }

  async removeForUser(id: string, userId: string) {
    await this.findOneForUser(id, userId);

    return this.prisma.agent.delete({
      where: { id },
    });
  }

  async executeForUser(
    id: string,
    userId: string,
    dto: ExecuteAgentDto,
  ): Promise<AgentExecutionResponseDto> {
    const agent = await this.findOneForUser(id, userId);

    const canonicalProvider = agent.provider.toLowerCase().trim();
    if (!isValidProvider(canonicalProvider)) {
      throw new BadRequestException(
        `Unsupported provider '${agent.provider}'.`,
      );
    }

    if (!isValidModel(canonicalProvider, agent.model)) {
      throw new BadRequestException(
        `Model '${agent.model}' is not supported for provider '${agent.provider}'.`,
      );
    }

    const decryptedApiKey =
      await this.apiKeysService.getDecryptedKeyByProviderForUser(
        userId,
        canonicalProvider,
      );

    const result = await this.providerAdapterService.execute({
      provider: canonicalProvider,
      model: agent.model,
      prompt: dto.prompt,
      apiKey: decryptedApiKey,
    });

    return {
      output: result.output,
      provider: canonicalProvider,
      model: agent.model,
    };
  }
}
