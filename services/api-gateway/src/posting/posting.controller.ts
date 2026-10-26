import { BadRequestException, Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../common/auth.guard';
import { parse } from '../common/zod';
import { PostingService } from './posting.service';
import { postBody, statusBody } from './posting.schema';
import { MAX_IMAGE_BYTES } from './images';

type Req_ = { user: { id: string } };

@ApiTags('posting')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class PostingController {
  constructor(private posting: PostingService) {}

  /** One photo per call; returns the file name to send in `images` when posting. */
  @Post('uploads')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  upload(@Req() req: Req_, @UploadedFile() file: Express.Multer.File | undefined) {
    return this.posting.saveUpload(req.user.id, file);
  }

  @Post('listings')
  @HttpCode(201)
  create(@Req() req: Req_, @Body() body: unknown) {
    return this.posting.create(req.user.id, parse(postBody, body));
  }

  @Get('me/listings')
  mine(@Req() req: Req_) {
    return this.posting.mine(req.user.id);
  }

  @Patch('me/listings/:id/status')
  setStatus(@Req() req: Req_, @Param('id') id: string, @Body() body: unknown) {
    return this.posting.setStatus(req.user.id, id, parse(statusBody, body).status);
  }

  @Delete('me/listings/:id')
  @HttpCode(204)
  async remove(@Req() req: Req_, @Param('id') id: string) {
    await this.posting.remove(req.user.id, id);
  }

  /** Phone number of whoever posted the listing; only signed-in users can see it. */
  @Get('listings/:id/contact')
  async contact(@Param('id') id: string) {
    const c = await this.posting.contact(id);
    if (!c) throw new NotFoundException('Listing not found');
    return c;
  }
}
