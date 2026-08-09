import { InternalServerErrorException } from '@nestjs/common';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;
  const originalEnv = process.env.API_KEY_ENCRYPTION_KEY;

  beforeEach(() => {
    service = new CryptoService();
    process.env.API_KEY_ENCRYPTION_KEY = '12345678901234567890123456789012';
  });

  afterAll(() => {
    process.env.API_KEY_ENCRYPTION_KEY = originalEnv;
  });

  it('should encrypt and decrypt payload successfully', () => {
    const rawSecret = 'sk-proj-test1234567890secretkey';
    const encrypted = service.encrypt(rawSecret);

    expect(encrypted).not.toBe(rawSecret);
    expect(encrypted.split(':')).toHaveLength(3);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it('should throw exception if API_KEY_ENCRYPTION_KEY is missing', () => {
    delete process.env.API_KEY_ENCRYPTION_KEY;
    expect(() => service.encrypt('test')).toThrow(InternalServerErrorException);
  });

  it('should throw exception if API_KEY_ENCRYPTION_KEY is not 32 bytes', () => {
    process.env.API_KEY_ENCRYPTION_KEY = 'too-short';
    expect(() => service.encrypt('test')).toThrow(InternalServerErrorException);
  });

  it('should accept a 64-character hex key representing 32 bytes', () => {
    process.env.API_KEY_ENCRYPTION_KEY =
      '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
    const rawSecret = 'hex-key-secret';
    const encrypted = service.encrypt(rawSecret);
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it('should throw exception on invalid decrypt format', () => {
    expect(() => service.decrypt('invalid-format')).toThrow(
      InternalServerErrorException,
    );
  });
});
