import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;

  const findUnique = jest.fn();
  const create = jest.fn();
  const signAsync = jest.fn();

  const prisma = {
    user: {
      findUnique,
      create,
    },
  } as unknown as PrismaService;

  const jwtService = {
    signAsync,
  } as unknown as JwtService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AuthService(prisma, jwtService);
  });

  describe('register', () => {
    it('should reject an existing email', async () => {
      findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      const dto: RegisterDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('should create a user when the email is available', async () => {
      findUnique.mockResolvedValue(null);

      create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dto: RegisterDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await service.register(dto);

      expect(create).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should reject a concurrent registration collision', async () => {
      findUnique.mockResolvedValue(null);
      create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Email is already registered');
    });
  });

  describe('login', () => {
    it('should reject invalid credentials', async () => {
      findUnique.mockResolvedValue(null);

      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should sign the authoritative JWT payload', async () => {
      findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: await argon2.hash('password123'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      signAsync.mockResolvedValue('token');

      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
      });
    });
  });
});
