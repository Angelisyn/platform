import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const findMany = jest.fn();
  const findFirst = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const deleteProject = jest.fn();

  const prisma = {
    project: {
      findMany,
      findFirst,
      create,
      update,
      delete: deleteProject,
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectsService(prisma);
  });

  it('should list projects scoped to the authenticated user', async () => {
    findMany.mockResolvedValue([
      { id: 'p1', name: 'Project 1', ownerId: 'user-1' },
    ]);

    const result = await service.findAllForUser('user-1');

    expect(findMany).toHaveBeenCalledWith({
      where: { ownerId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toHaveLength(1);
  });

  it('should find one project owned by user', async () => {
    findFirst.mockResolvedValue({
      id: 'p1',
      name: 'Project 1',
      ownerId: 'user-1',
    });

    const result = await service.findOneForUser('p1', 'user-1');

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'p1', ownerId: 'user-1' },
    });
    expect(result.id).toBe('p1');
  });

  it('should throw NotFoundException if project is missing or owned by another user', async () => {
    findFirst.mockResolvedValue(null);

    await expect(service.findOneForUser('p1', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should create project scoped to current user', async () => {
    create.mockResolvedValue({
      id: 'p1',
      name: 'New Proj',
      slug: 'new-proj',
      ownerId: 'user-1',
    });

    const result = await service.createForUser('user-1', {
      name: 'New Proj',
      slug: 'new-proj',
    });

    expect(create).toHaveBeenCalledWith({
      data: { name: 'New Proj', slug: 'new-proj', ownerId: 'user-1' },
    });
    expect(result.ownerId).toBe('user-1');
  });

  it('should update project if owned by user', async () => {
    findFirst.mockResolvedValue({ id: 'p1', name: 'Old', ownerId: 'user-1' });
    update.mockResolvedValue({ id: 'p1', name: 'Updated', ownerId: 'user-1' });

    const result = await service.updateForUser('p1', 'user-1', {
      name: 'Updated',
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { name: 'Updated' },
    });
    expect(result.name).toBe('Updated');
  });

  it('should prevent updating another user project', async () => {
    findFirst.mockResolvedValue(null);

    await expect(
      service.updateForUser('p1', 'user-2', { name: 'Hacked' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should delete project if owned by user', async () => {
    findFirst.mockResolvedValue({
      id: 'p1',
      name: 'To Delete',
      ownerId: 'user-1',
    });
    deleteProject.mockResolvedValue({ id: 'p1' });

    await service.removeForUser('p1', 'user-1');

    expect(deleteProject).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });

  it('should prevent deleting another user project', async () => {
    findFirst.mockResolvedValue(null);

    await expect(service.removeForUser('p1', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
