import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { isValidProvider } from '../common/providers/provider-registry';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';

export function maskApiKey(rawKey: string): string {
  if (!rawKey) {
    return '****';
  }
  if (rawKey.length <= 8) {
    return '****' + rawKey.slice(-2);
  }
  const start = rawKey.slice(0, 3);
  const end = rawKey.slice(-4);
  return `${start}...${end}`;
}

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  private sanitizeApiKey(apiKey: {
    id: string;
    name: string | null;
    provider: string;
    key: string;
    createdAt: Date;
    updatedAt: Date;
  }): ApiKeyResponseDto {
    const decryptedKey = this.cryptoService.decrypt(apiKey.key);
    return {
      id: apiKey.id,
      name: apiKey.name,
      provider: apiKey.provider,
      keyMasked: maskApiKey(decryptedKey),
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    };
  }

  async findAllForUser(userId: string): Promise<ApiKeyResponseDto[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map((key) => this.sanitizeApiKey(key));
  }

  async findOneForUser(id: string, userId: string): Promise<ApiKeyResponseDto> {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });
    if (!key) {
      throw new NotFoundException('API key not found');
    }
    return this.sanitizeApiKey(key);
  }

  async createForUser(
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    const canonicalProvider = dto.provider.toLowerCase().trim();
    if (!isValidProvider(canonicalProvider)) {
      throw new BadRequestException(`Unsupported provider '${dto.provider}'.`);
    }
    const encryptedKey = this.cryptoService.encrypt(dto.key);
    let createdKey;
    try {
      createdKey = await this.prisma.apiKey.create({
        data: {
          name: dto.name,
          provider: canonicalProvider,
          key: encryptedKey,
          userId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'The specified user does not exist',
        );
      }
      throw error;
    }
    return this.sanitizeApiKey(createdKey);
  }

  async removeForUser(id: string, userId: string): Promise<ApiKeyResponseDto> {
    const existing = await this.findOneForUser(id, userId);
    try {
      await this.prisma.apiKey.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cannot delete API key with dependent resources',
        );
      }
      throw error;
    }
    return existing;
  }

  async getDecryptedKeyForInternalUse(
    id: string,
    userId: string,
  ): Promise<string> {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });
    if (!key) {
      throw new NotFoundException('API key not found');
    }
    return this.cryptoService.decrypt(key.key);
  }

  async getDecryptedKeyByProviderForUser(
    userId: string,
    provider: string,
  ): Promise<string> {
    const canonicalProvider = provider.toLowerCase().trim();
    if (!isValidProvider(canonicalProvider)) {
      throw new BadRequestException(`Unsupported provider '${provider}'.`);
    }
    const key = await this.prisma.apiKey.findFirst({
      where: { userId, provider: canonicalProvider },
    });
    if (!key) {
      throw new BadRequestException(
        `No API key configured for provider '${canonicalProvider}'.`,
      );
    }
    return this.cryptoService.decrypt(key.key);
  }
}
