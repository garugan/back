import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { UpsertRestaurantDto } from './dto/upsert-restaurant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types';

@Controller('restaurants')
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.restaurantsService.findAll(request.user.userId);
  }

  @Get('search')
  search(@Query('q') query = '') {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    return this.restaurantsService.search(normalizedQuery);
  }

  @Post()
  upsert(@Req() request: AuthenticatedRequest, @Body() body: UpsertRestaurantDto) {
    return this.restaurantsService.upsert(request.user.userId, body);
  }
}
