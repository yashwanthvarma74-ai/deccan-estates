import { Controller, Delete, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../common/auth.guard';
import { PrismaService } from '../common/prisma.service';
import { toDto } from '../listings/listings.service';

@ApiTags('saved')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('me/saved')
export class SavedController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Req() req: { user: { id: string } }) {
    const rows = await this.prisma.savedListing.findMany({
      where: { userId: req.user.id },
      include: { listing: { include: { locality: true, agent: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => toDto(r.listing));
  }

  @Put(':listingId')
  async save(@Req() req: { user: { id: string } }, @Param('listingId') listingId: string) {
    await this.prisma.savedListing.upsert({
      where: { userId_listingId: { userId: req.user.id, listingId } },
      create: { userId: req.user.id, listingId },
      update: {},
    });
    return { saved: true };
  }

  @Delete(':listingId')
  async unsave(@Req() req: { user: { id: string } }, @Param('listingId') listingId: string) {
    await this.prisma.savedListing.deleteMany({ where: { userId: req.user.id, listingId } });
    return { saved: false };
  }
}
