import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
    try {
      return await this.prisma.project.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          ownerId: userId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A project with this slug already exists');
      }
      throw error;
    }
  }

  async updateForUser(id: string, userId: string, dto: UpdateProjectDto) {
    await this.findOneForUser(id, userId);

    try {
      return await this.prisma.project.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A project with this slug already exists');
      }
      throw error;
    }
  }

  async removeForUser(id: string, userId: string) {
    await this.findOneForUser(id, userId);

    try {
      return await this.prisma.project.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cannot delete project with dependent resources',
        );
      }
      throw error;
    }
  }
}
