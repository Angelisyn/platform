import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  afterEach(() => {
    jest.clearAllMocks();

    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('fails clearly when the JWT secret is unavailable', () => {
    delete process.env.JWT_SECRET;

    expect(() => new JwtStrategy(prisma)).toThrow(
      'JWT_SECRET environment variable is required',
    );
  });

  it('returns the authenticated user without the password', async () => {
    process.env.JWT_SECRET = 'test-secret';
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const user = await new JwtStrategy(prisma).validate({
      sub: 'user-1',
      email: 'test@example.com',
    });

    expect(user).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
  });
});
