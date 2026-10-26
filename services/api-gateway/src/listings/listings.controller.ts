import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { parse } from '../common/zod';
import { ListingsService, listingQuery } from './listings.service';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private listings: ListingsService) {}

  @Get()
  @ApiQuery({ name: 'locality', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'minBeds', required: false })
  @ApiQuery({ name: 'minArea', required: false })
  @ApiQuery({ name: 'maxArea', required: false })
  @ApiQuery({ name: 'agent', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false })
  list(@Query() query: Record<string, unknown>) {
    return this.listings.list(parse(listingQuery, query));
  }

  @Get('map')
  map(@Query() query: Record<string, unknown>) {
    return this.listings.mapPoints(parse(listingQuery, query));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.listings.get(id);
  }
}
