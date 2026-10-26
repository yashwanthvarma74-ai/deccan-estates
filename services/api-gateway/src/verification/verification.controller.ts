import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../common/auth.guard';
import { VerificationService } from './verification.service';

@ApiTags('verification')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('listings/:id/verification')
export class VerificationController {
  constructor(private verification: VerificationService) {}

  /** Creates the report for a listing that has none, using the verification service when it is reachable. */
  @Post()
  ensure(@Param('id') id: string) {
    return this.verification.ensure(id);
  }
}
