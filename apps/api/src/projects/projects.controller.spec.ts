import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { TargetsService } from '../targets/targets.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  const findAllForUser = jest.fn();
  const findOneForUser = jest.fn();
  const createForUser = jest.fn();
  const updateForUser = jest.fn();
  const removeForUser = jest.fn();

  const service = {
    findAllForUser,
    findOneForUser,
    createForUser,
    updateForUser,
    removeForUser,
  } as unknown as ProjectsService;

  const targetsService = {
    findByProjectForUser: jest.fn(),
  } as unknown as TargetsService;

  const mockUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'User One',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ProjectsController(service, targetsService);
  });

  it('should call findAllForUser with current user id', async () => {
    findAllForUser.mockResolvedValue([]);
    await controller.findAll(mockUser);
    expect(findAllForUser).toHaveBeenCalledWith('user-1');
  });

  it('should call findOneForUser with id and current user id', async () => {
    findOneForUser.mockResolvedValue({
      id: 'p1',
      name: 'P1',
      slug: 'p1',
      ownerId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await controller.findOne('p1', mockUser);
    expect(findOneForUser).toHaveBeenCalledWith('p1', 'user-1');
  });

  it('should call createForUser with user id and dto', async () => {
    const dto = { name: 'P1', slug: 'p1' };
    await controller.create(mockUser, dto);
    expect(createForUser).toHaveBeenCalledWith('user-1', dto);
  });

  it('should call updateForUser with id, user id, and dto', async () => {
    const dto = { name: 'P1 Updated' };
    await controller.update('p1', mockUser, dto);
    expect(updateForUser).toHaveBeenCalledWith('p1', 'user-1', dto);
  });

  it('should call removeForUser with id and user id', async () => {
    await controller.remove('p1', mockUser);
    expect(removeForUser).toHaveBeenCalledWith('p1', 'user-1');
  });

  it('should call findByProjectForUser for GET /projects/:id/targets', async () => {
    (targetsService.findByProjectForUser as jest.Mock).mockResolvedValue([]);
    await controller.findTargetsForProject('p1', mockUser);
    expect(targetsService.findByProjectForUser).toHaveBeenCalledWith('p1', 'user-1');
  });
});
