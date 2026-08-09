import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private getEncryptionKey(): Buffer {
    const key = process.env.API_KEY_ENCRYPTION_KEY;
    if (!key) {
      throw new InternalServerErrorException(
        'API_KEY_ENCRYPTION_KEY environment variable is not defined',
      );
    }

    let keyBuffer = Buffer.from(key, 'utf-8');
    if (keyBuffer.length !== 32) {
      if (key.length === 64 && /^[0-9a-fA-F]{64}$/.test(key)) {
        keyBuffer = Buffer.from(key, 'hex');
      }
    }

    if (keyBuffer.length !== 32) {
      throw new InternalServerErrorException(
        'API_KEY_ENCRYPTION_KEY must be exactly 32 bytes',
      );
    }

    return keyBuffer;
  }

  encrypt(text: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const key = this.getEncryptionKey();
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new InternalServerErrorException(
        'Invalid encrypted key payload format',
      );
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
