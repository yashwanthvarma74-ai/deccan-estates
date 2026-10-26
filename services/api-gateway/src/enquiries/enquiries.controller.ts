import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { parse } from '../common/zod';
import { PrismaService } from '../common/prisma.service';
import { TOPICS } from '../events/events.service';
import { OutboxService } from '../events/outbox.service';

const phone = z.string().trim().regex(/^[+0-9][0-9 ()-]{7,17}$/, 'Enter a valid phone number');

export const enquiryBody = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  phone,
  email: z.string().trim().email().max(120).optional().or(z.literal('').transform(() => undefined)),
  propertyType: z.enum(['PLOT', 'VILLA', 'APARTMENT', 'GATED_COMMUNITY', 'COMMERCIAL']).optional(),
  locality: z.string().trim().max(60).optional().or(z.literal('').transform(() => undefined)),
  expectedPriceLakh: z.coerce.number().positive().max(100000).optional().or(z.literal('').transform(() => undefined)),
  message: z.string().trim().max(600).optional().or(z.literal('').transform(() => undefined)),
  /** Honeypot: real people never fill this in. */
  website: z.string().max(0).optional(),
});

@ApiTags('enquiries')
@Controller('enquiries')
export class EnquiriesController {
  constructor(private prisma: PrismaService, private outbox: OutboxService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown) {
    const d = parse(enquiryBody, body);
    // The enquiry and its event are saved together, so the event survives a Kafka outage.
    await this.prisma.$transaction(async (tx) => {
      const row = await tx.enquiry.create({
        data: {
          name: d.name,
          phone: d.phone,
          email: d.email,
          propertyType: d.propertyType,
          locality: d.locality,
          expectedPriceInr: d.expectedPriceLakh ? BigInt(Math.round(d.expectedPriceLakh * 100000)) : undefined,
          message: d.message,
        },
      });
      // Contact details stay in the database; the event carries only what a consumer needs to look the enquiry up.
      await this.outbox.enqueue(tx, TOPICS.enquiryCreated, row.id, {
        id: row.id,
        propertyType: row.propertyType,
        locality: row.locality,
        expectedPriceInr: row.expectedPriceInr === null ? null : Number(row.expectedPriceInr),
        createdAt: row.createdAt.toISOString(),
      });
    });
    void this.outbox.dispatch();
    return { ok: true };
  }
}
