import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './common/prisma.service';
import { RedisService } from './common/redis.service';
import { RateLimitGuard } from './common/rate-limit.guard';
import { AuthGuard } from './common/auth.guard';
import { HealthController } from './health.controller';
import { ListingsController } from './listings/listings.controller';
import { ListingsService } from './listings/listings.service';
import { LocalitiesController } from './localities/localities.controller';
import { AgentsController } from './agents.controller';
import { SavedController } from './saved/saved.controller';
import { EnquiriesController } from './enquiries/enquiries.controller';
import { PostingController } from './posting/posting.controller';
import { PostingService } from './posting/posting.service';
import { StorageService } from './posting/storage.service';
import { EventsService } from './events/events.service';
import { OutboxService } from './events/outbox.service';
import { VerificationController } from './verification/verification.controller';
import { VerificationService } from './verification/verification.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [HealthController, ListingsController, LocalitiesController, SavedController, AgentsController, EnquiriesController, VerificationController, PostingController],
  providers: [
    PrismaService,
    RedisService,
    ListingsService,
    VerificationService,
    PostingService,
    StorageService,
    EventsService,
    OutboxService,
    AuthGuard,
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule {}
