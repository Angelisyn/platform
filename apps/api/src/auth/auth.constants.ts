export const DEFAULT_JWT_EXPIRES_IN = '1d';

export function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwtSecret;
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN ?? DEFAULT_JWT_EXPIRES_IN;
}
