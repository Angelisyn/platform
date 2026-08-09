import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { ApiKeysService } from './api-keys.service';

describe('ApiKeysService', () => {
  let service: ApiKeysService;

  const findMany = jest.fn();
  const findFirst = jest.fn();
  const create = jest.fn();
  const deleteKey = jest.fn();

  const encrypt = jest.fn();
  const decrypt = jest.fn();

  const prisma = {
    apiKey: {
      findMany,
      findFirst,
      create,
      delete: deleteKey,
    },
  } as unknown as PrismaService;

  const cryptoService = {
    encrypt,
    decrypt,
  } as unknown as CryptoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ApiKeysService(prisma, cryptoService);
  });

  describe('createForUser', () => {
    it('should encrypt raw key before storing and return sanitized response with keyMasked', async () => {
      const dto = {
        name: 'My OpenAI Key',
        provider: 'openai',
        key: 'sk-proj-1234567890abcdef',
      };
      encrypt.mockReturnValue('enc_iv:authTag:encryptedSecret');
      decrypt.mockReturnValue('sk-proj-1234567890abcdef');
      create.mockResolvedValue({
        id: 'key-1',
        name: 'My OpenAI Key',
        provider: 'openai',
        key: 'enc_iv:authTag:encryptedSecret',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createForUser('user-1', dto);

      expect(encrypt).toHaveBeenCalledWith('sk-proj-1234567890abcdef');
      expect(create).toHaveBeenCalledWith({
        data: {
          name: 'My OpenAI Key',
          provider: 'openai',
          key: 'enc_iv:authTag:encryptedSecret',
          userId: 'user-1',
        },
      });
      expect(result.id).toBe('key-1');
      expect(result.keyMasked).toBe('sk-...cdef');
      expect('key' in result).toBe(false);
    });

    it('should reject creating API key for invalid/unsupported provider', async () => {
      const dto = {
        name: 'Invalid Key',
        provider: 'open',
        key: 'sk-proj-1234567890abcdef',
      };
      await expect(service.createForUser('user-1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findAllForUser', () => {
    it('should scope query to current user and return redacted response list', async () => {
      findMany.mockResolvedValue([
        {
          id: 'key-1',
          name: 'OpenAI',
          provider: 'openai',
          key: 'enc_payload_1',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      decrypt.mockReturnValue('sk-proj-9876543210fedcba');

      const result = await service.findAllForUser('user-1');

      expect(findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].keyMasked).toBe('sk-...dcba');
      expect('key' in result[0]).toBe(false);
    });
  });

  describe('findOneForUser', () => {
    it('should find key owned by current user and return sanitized response', async () => {
      findFirst.mockResolvedValue({
        id: 'key-1',
        name: 'OpenAI',
        provider: 'openai',
        key: 'enc_payload_2',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      decrypt.mockReturnValue('sk-ant-1234567890qwerty');

      const result = await service.findOneForUser('key-1', 'user-1');

      expect(findFirst).toHaveBeenCalledWith({
        where: { id: 'key-1', userId: 'user-1' },
      });
      expect(result.id).toBe('key-1');
      expect(result.keyMasked).toBe('sk-...erty');
      expect('key' in result).toBe(false);
    });

    it('should throw NotFoundException if key does not exist or belongs to another user', async () => {
      findFirst.mockResolvedValue(null);

      await expect(
        service.findOneForUser('key-1', 'user-2'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('removeForUser', () => {
    it('should verify ownership and delete key owned by user', async () => {
      findFirst.mockResolvedValue({
        id: 'key-1',
        name: 'To Delete',
        provider: 'openai',
        key: 'enc_payload_3',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      decrypt.mockReturnValue('sk-proj-1234567890abcdef');
      deleteKey.mockResolvedValue({ id: 'key-1' });

      const result = await service.removeForUser('key-1', 'user-1');

      expect(deleteKey).toHaveBeenCalledWith({ where: { id: 'key-1' } });
      expect(result.id).toBe('key-1');
      expect('key' in result).toBe(false);
    });

    it('should throw NotFoundException when trying to delete key owned by another user', async () => {
      findFirst.mockResolvedValue(null);

      await expect(
        service.removeForUser('key-1', 'user-2'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getDecryptedKeyForInternalUse', () => {
    it('should return decrypted raw key for internal backend services if owned by user', async () => {
      findFirst.mockResolvedValue({
        id: 'key-1',
        name: 'Internal',
        provider: 'openai',
        key: 'enc_payload_4',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      decrypt.mockReturnValue('sk-proj-decrypted-raw-key');

      const rawKey = await service.getDecryptedKeyForInternalUse(
        'key-1',
        'user-1',
      );

      expect(rawKey).toBe('sk-proj-decrypted-raw-key');
    });

    it('should throw NotFoundException if key is not owned by user during internal decryption request', async () => {
      findFirst.mockResolvedValue(null);

      await expect(
        service.getDecryptedKeyForInternalUse('key-1', 'user-2'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
