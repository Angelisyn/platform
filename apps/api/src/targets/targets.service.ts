import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTargetDto } from './dto/create-target.dto';
import { UpdateTargetDto } from './dto/update-target.dto';

@Injectable()
export class TargetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    return this.prisma.target.findMany({
      where: {
        project: {
          ownerId: userId,
        },
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(id: string, userId: string) {
    const target = await this.prisma.target.findFirst({
      where: {
        id,
        project: {
          ownerId: userId,
        },
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!target) {
      throw new NotFoundException('Target not found');
    }

    return target;
  }

  async findByProjectForUser(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.target.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createForUser(userId: string, dto: CreateTargetDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, ownerId: userId },
    });

    if (!project) {
      throw new ForbiddenException('Project does not belong to user or does not exist');
    }

    return this.prisma.target.create({
      data: {
        name: dto.name,
        target: dto.target,
        type: dto.type,
        projectId: dto.projectId,
      },
    });
  }

  async updateForUser(id: string, userId: string, dto: UpdateTargetDto) {
    await this.findOneForUser(id, userId);

    return this.prisma.target.update({
      where: { id },
      data: dto,
    });
  }

  async removeForUser(id: string, userId: string) {
    await this.findOneForUser(id, userId);

    return this.prisma.target.delete({
      where: { id },
    });
  }
}
