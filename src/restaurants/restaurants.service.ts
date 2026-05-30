import { Injectable } from '@nestjs/common';
import { Restaurant } from '@prisma/client';
import { PlacesService } from '../places/places.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertRestaurantDto } from './dto/upsert-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly placesService: PlacesService,
    private readonly prisma: PrismaService,
  ) {}

  search(query: string) {
    return this.placesService.searchText(query);
  }

  async findAll(userId: string) {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return restaurants.map((restaurant) => this.toResponse(restaurant));
  }

  async upsert(userId: string, data: UpsertRestaurantDto) {
    const { id, ...rest } = data;
    const restaurant = await this.prisma.restaurant.upsert({
      where: {
        userId_placeId: {
          userId,
          placeId: id,
        },
      },
      create: {
        ...rest,
        placeId: id,
        userId,
      },
      update: rest,
    });

    return this.toResponse(restaurant);
  }

  private toResponse(restaurant: Restaurant) {
    return {
      id: restaurant.placeId,
      name: restaurant.name,
      photo: restaurant.photo ?? '',
      status: restaurant.status,
      rating: restaurant.rating,
      visitDate: restaurant.visitDate ?? undefined,
      memo: restaurant.memo,
      floor: restaurant.floor,
      elevator: restaurant.elevator,
      category: restaurant.category,
      address: restaurant.address,
    };
  }
}
