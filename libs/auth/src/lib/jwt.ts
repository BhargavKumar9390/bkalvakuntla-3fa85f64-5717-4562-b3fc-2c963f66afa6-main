import * as jwt from 'jsonwebtoken';

const getSecret = () => {
  const s = process.env['JWT_SECRET'];
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
};

export function signJwt(
  payload: Record<string, any>,
  expiresIn = process.env['JWT_EXPIRATION'] || '1h'
) {
  // jsonwebtoken types can be strict; cast to any to satisfy TS in this helper
  return (jwt as any).sign(
    payload,
    getSecret() as any,
    { expiresIn } as any
  ) as string;
}

export function verifyJwt<T = any>(token: string): T {
  return (jwt as any).verify(token, getSecret() as any) as T;
}
