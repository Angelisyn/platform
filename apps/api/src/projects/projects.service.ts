import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    return this.prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, ownerId: userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async createForUser(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...dto,
        ownerId: userId,
      },
    });
  }

  async updateForUser(id: string, userId: string, dto: UpdateProjectDto) {
    await this.findOneForUser(id, userId);

    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async removeForUser(id: string, userId: string) {
    await this.findOneForUser(id, userId);

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
