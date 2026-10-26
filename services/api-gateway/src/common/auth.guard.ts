import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const AUTH_URL = process.env.AUTH_URL ?? 'http://localhost:3000';
const jwks = createRemoteJWKSet(new URL(`${AUTH_URL}/api/auth/jwks`));

/**
 * Validates the JWT issued by Better Auth (apps/web) against its JWKS endpoint.
 * Sets req.user = { id }.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      const { payload } = await jwtVerify(header.slice(7), jwks, { issuer: AUTH_URL });
      if (!payload.sub) throw new Error('no sub');
      req.user = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
