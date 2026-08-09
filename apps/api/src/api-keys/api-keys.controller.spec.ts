import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

describe('ApiKeysController', () => {
  let controller: ApiKeysController;
  const findAllForUser = jest.fn();
  const findOneForUser = jest.fn();
  const createForUser = jest.fn();
  const removeForUser = jest.fn();

  const service = {
    findAllForUser,
    findOneForUser,
    createForUser,
    removeForUser,
  } as unknown as ApiKeysService;

  const mockUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'User One',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ApiKeysController(service);
  });

  it('should be protected with JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      ApiKeysController,
    ) as unknown[];
    expect(guards).toContain(JwtAuthGuard);
  });

  it('should delegate findAll to service using authenticated user id', async () => {
    findAllForUser.mockResolvedValue([]);
    await controller.findAll(mockUser);
    expect(findAllForUser).toHaveBeenCalledWith('user-1');
  });

  it('should delegate findOne to service using key id and user id', async () => {
    const mockRes = {
      id: 'k1',
      name: 'OpenAI',
      provider: 'openai',
      keyMasked: 'sk-...1234',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    findOneForUser.mockResolvedValue(mockRes);
    const result = await controller.findOne('k1', mockUser);
    expect(findOneForUser).toHaveBeenCalledWith('k1', 'user-1');
    expect(result).toBe(mockRes);
  });

  it('should delegate create to service using user id and dto', async () => {
    const dto = { provider: 'openai', key: 'raw-secret' };
    await controller.create(mockUser, dto);
    expect(createForUser).toHaveBeenCalledWith('user-1', dto);
  });

  it('should delegate remove to service using key id and user id', async () => {
    await controller.remove('k1', mockUser);
    expect(removeForUser).toHaveBeenCalledWith('k1', 'user-1');
  });
});
