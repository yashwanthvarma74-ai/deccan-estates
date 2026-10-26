import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './common/prisma.service';
import { RedisService } from './common/redis.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    // The cache is optional: the API keeps working without it, so a missing Redis is reported but is not a failure.
    const redis = await this.redis.client.ping().then(() => 'ok', () => 'unavailable');
    return { status: 'ok', redis };
  }
}
