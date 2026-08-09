import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

describe('AgentsController', () => {
  let controller: AgentsController;
  const findAllForUser = jest.fn();
  const findOneForUser = jest.fn();
  const createForUser = jest.fn();
  const updateForUser = jest.fn();
  const removeForUser = jest.fn();
  const executeForUser = jest.fn();

  const service = {
    findAllForUser,
    findOneForUser,
    createForUser,
    updateForUser,
    removeForUser,
    executeForUser,
  } as unknown as AgentsService;

  const mockUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'User One',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AgentsController(service);
  });

  it('should call findAllForUser with current user id', async () => {
    findAllForUser.mockResolvedValue([]);
    await controller.findAll(mockUser);
    expect(findAllForUser).toHaveBeenCalledWith('user-1');
  });

  it('should call findOneForUser with id and current user id', async () => {
    findOneForUser.mockResolvedValue({
      id: 'a1',
      name: 'A1',
      provider: 'openai',
      model: 'gpt-4',
      projectId: 'p1',
      createdAt: new Date(),
    });
    await controller.findOne('a1', mockUser);
    expect(findOneForUser).toHaveBeenCalledWith('a1', 'user-1');
  });

  it('should call createForUser with user id and dto', async () => {
    const dto = {
      name: 'A1',
      provider: 'openai',
      model: 'gpt-4',
      projectId: 'p1',
    };
    await controller.create(mockUser, dto);
    expect(createForUser).toHaveBeenCalledWith('user-1', dto);
  });

  it('should call updateForUser with id, user id, and dto', async () => {
    const dto = { name: 'A1 Updated' };
    await controller.update('a1', mockUser, dto);
    expect(updateForUser).toHaveBeenCalledWith('a1', 'user-1', dto);
  });

  it('should call removeForUser with id and user id', async () => {
    await controller.remove('a1', mockUser);
    expect(removeForUser).toHaveBeenCalledWith('a1', 'user-1');
  });

  it('should call executeForUser with agent id, user id, and execute dto', async () => {
    const executeDto = { prompt: 'Hello world' };
    executeForUser.mockResolvedValue({
      output: 'Response output',
      provider: 'openai',
      model: 'gpt-4o',
    });

    const response = await controller.execute('a1', mockUser, executeDto);

    expect(executeForUser).toHaveBeenCalledWith('a1', 'user-1', executeDto);
    expect(response).toEqual({
      output: 'Response output',
      provider: 'openai',
      model: 'gpt-4o',
    });
  });
});
