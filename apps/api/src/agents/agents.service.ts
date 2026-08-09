import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

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
      data: dto,
    });
  }

  async updateForUser(id: string, userId: string, dto: UpdateAgentDto) {
    await this.findOneForUser(id, userId);

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
      data: dto,
    });
  }

  async removeForUser(id: string, userId: string) {
    await this.findOneForUser(id, userId);

    return this.prisma.agent.delete({
      where: { id },
    });
  }
}
