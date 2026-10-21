import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

const LIMIT = 120;
const WINDOW_SECONDS = 60;

/** Fixed-window per-IP limiter backed by Redis. Fails open if Redis is unavailable. */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    const key = `rl:${req.ip}:${Math.floor(Date.now() / 1000 / WINDOW_SECONDS)}`;
    try {
      const count = await this.redis.client.incr(key);
      if (count === 1) await this.redis.client.expire(key, WINDOW_SECONDS);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, LIMIT - count));
      if (count > LIMIT) throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    } catch (e) {
      if (e instanceof HttpException) throw e;
    }
    return true;
  }
}
