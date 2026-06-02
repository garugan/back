import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PlacesService } from './places.service';

describe('PlacesService', () => {
  let service: PlacesService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    configService = {
      get: jest.fn().mockReturnValue('test-api-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlacesService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<PlacesService>(PlacesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns only food and drink places', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        places: [
          {
            id: 'places/ramen',
            displayName: { text: 'テストラーメン' },
            formattedAddress: '東京都渋谷区1-1-1',
            primaryType: 'ramen_restaurant',
            primaryTypeDisplayName: { text: 'ラーメン屋' },
            types: ['ramen_restaurant', 'restaurant', 'food', 'establishment'],
          },
          {
            id: 'places/station',
            displayName: { text: '渋谷駅' },
            formattedAddress: '東京都渋谷区',
            primaryType: 'train_station',
            primaryTypeDisplayName: { text: '駅' },
            types: ['train_station', 'transit_station', 'establishment'],
          },
          {
            id: 'places/cafe',
            displayName: { text: 'テストカフェ' },
            formattedAddress: '東京都渋谷区2-2-2',
            primaryType: 'coffee_shop',
            primaryTypeDisplayName: { text: 'コーヒーショップ' },
            types: ['coffee_shop', 'cafe', 'food', 'establishment'],
          },
        ],
      }),
    } as Response);

    await expect(service.searchText('渋谷')).resolves.toEqual([
      {
        id: 'places/ramen',
        name: 'テストラーメン',
        address: '東京都渋谷区1-1-1',
        category: 'ラーメン屋',
      },
      {
        id: 'places/cafe',
        name: 'テストカフェ',
        address: '東京都渋谷区2-2-2',
        category: 'コーヒーショップ',
      },
    ]);
  });

  it('requests place types for backend filtering', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ places: [] }),
    } as Response);

    await service.searchText('渋谷 カフェ');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://places.googleapis.com/v1/places:searchText',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Goog-FieldMask': expect.stringContaining('places.types'),
        }),
      }),
    );
  });

  it('returns photo metadata without fetching photo media during search', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        places: [
          {
            id: 'places/cafe',
            displayName: { text: 'テストカフェ' },
            formattedAddress: '東京都渋谷区2-2-2',
            primaryType: 'coffee_shop',
            primaryTypeDisplayName: { text: 'コーヒーショップ' },
            types: ['coffee_shop', 'cafe', 'food', 'establishment'],
            photos: [{ name: 'places/cafe/photos/photo-1' }],
          },
        ],
      }),
    } as Response);

    await expect(service.searchText('渋谷 カフェ')).resolves.toEqual([
      {
        id: 'places/cafe',
        name: 'テストカフェ',
        address: '東京都渋谷区2-2-2',
        category: 'コーヒーショップ',
        photoName: 'places/cafe/photos/photo-1',
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://places.googleapis.com/v1/places:searchText',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Goog-FieldMask': expect.stringContaining('places.photos'),
        }),
      }),
    );
  });

  it('fetches a photo uri for a selected place photo', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        photoUri: 'https://lh3.googleusercontent.com/test-photo',
      }),
    } as Response);

    await expect(
      service.resolvePhotoUri('places/cafe/photos/photo-1'),
    ).resolves.toBe('https://lh3.googleusercontent.com/test-photo');

    expect(fetchMock.mock.calls[0][0].toString()).toContain(
      'places.googleapis.com/v1/places/cafe/photos/photo-1/media',
    );
    expect(fetchMock.mock.calls[0][0].toString()).toContain('skipHttpRedirect=true');
  });
});
