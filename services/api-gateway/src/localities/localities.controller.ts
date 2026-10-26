import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

@ApiTags('localities')
@Controller('localities')
export class LocalitiesController {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  @Get()
  list() {
    return this.redis.cached('localities', 300, () =>
      this.prisma.locality.findMany({ orderBy: { name: 'asc' } }),
    );
  }
}
