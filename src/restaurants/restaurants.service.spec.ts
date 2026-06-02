import { Test, TestingModule } from '@nestjs/testing';
import { PlacesService } from '../places/places.service';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantsService } from './restaurants.service';

describe('RestaurantsService', () => {
  let service: RestaurantsService;
  let placesService: { searchText: jest.Mock; resolvePhotoUri: jest.Mock };
  let prismaService: {
    restaurant: {
      findMany: jest.Mock;
      upsert: jest.Mock;
    };
  };

  beforeEach(async () => {
    placesService = {
      searchText: jest.fn(),
      resolvePhotoUri: jest.fn(),
    };
    prismaService = {
      restaurant: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        {
          provide: PlacesService,
          useValue: placesService,
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('fetches a photo only when saving a selected search result', async () => {
    placesService.resolvePhotoUri.mockResolvedValue('https://lh3.googleusercontent.com/photo');
    prismaService.restaurant.upsert.mockResolvedValue({
      placeId: 'places/cafe',
      name: 'テストカフェ',
      photo: 'https://lh3.googleusercontent.com/photo',
      status: 'want',
      rating: 0,
      visitDate: null,
      memo: '',
      floor: '1F',
      elevator: 'unknown',
      category: 'コーヒーショップ',
      address: '東京都渋谷区2-2-2',
    });

    await service.upsert('user-1', {
      id: 'places/cafe',
      name: 'テストカフェ',
      photo: '',
      photoName: 'places/cafe/photos/photo-1',
      status: 'want',
      rating: 0,
      memo: '',
      floor: '1F',
      elevator: 'unknown',
      category: 'コーヒーショップ',
      address: '東京都渋谷区2-2-2',
    });

    expect(placesService.resolvePhotoUri).toHaveBeenCalledWith(
      'places/cafe/photos/photo-1',
    );
    expect(prismaService.restaurant.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          photo: 'https://lh3.googleusercontent.com/photo',
        }),
        update: expect.objectContaining({
          photo: 'https://lh3.googleusercontent.com/photo',
        }),
      }),
    );
  });
});
