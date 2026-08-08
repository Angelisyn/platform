import {
  DEFAULT_JWT_EXPIRES_IN,
  getJwtExpiresIn,
  getJwtSecret,
} from './auth.constants';

describe('JWT configuration', () => {
  const originalJwtExpiresIn = process.env.JWT_EXPIRES_IN;
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalJwtExpiresIn === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = originalJwtExpiresIn;
    }

    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('uses a one-day expiry by default', () => {
    delete process.env.JWT_EXPIRES_IN;

    expect(getJwtExpiresIn()).toBe(DEFAULT_JWT_EXPIRES_IN);
  });

  it('uses the configured expiry', () => {
    process.env.JWT_EXPIRES_IN = '2h';

    expect(getJwtExpiresIn()).toBe('2h');
  });

  it('fails clearly when the JWT secret is unavailable', () => {
    delete process.env.JWT_SECRET;

    expect(getJwtSecret).toThrow('JWT_SECRET environment variable is required');
  });
});
