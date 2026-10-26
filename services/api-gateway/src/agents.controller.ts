import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from './common/prisma.service';
import { RedisService } from './common/redis.service';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  @Get()
  list() {
    return this.redis.cached('agents', 300, async () => {
      const agents = await this.prisma.agent.findMany({
        include: { _count: { select: { listings: true } } },
        orderBy: { name: 'asc' },
      });
      return agents.map(({ _count, ...a }) => ({ ...a, listingCount: _count.listings }));
    });
  }
}
