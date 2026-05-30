import { Test, TestingModule } from '@nestjs/testing';
import { PlacesService } from '../places/places.service';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantsService } from './restaurants.service';

describe('RestaurantsService', () => {
  let service: RestaurantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        {
          provide: PlacesService,
          useValue: {
            searchText: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            restaurant: {
              findMany: jest.fn(),
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
