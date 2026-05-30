import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PlaceSearchResult {
  id: string;
  name: string;
  address: string;
  category: string;
  photo?: string;
}

interface GoogleTextSearchResponse {
  places?: Array<{
    id?: string;
    displayName?: {
      text?: string;
    };
    formattedAddress?: string;
    primaryType?: string;
    primaryTypeDisplayName?: {
      text?: string;
    };
    types?: string[];
    photos?: Array<{
      name?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
}

interface GooglePhotoMediaResponse {
  photoUri?: string;
}

const FOOD_AND_DRINK_EXACT_TYPES = new Set([
  'acai_shop',
  'bagel_shop',
  'bakery',
  'bar',
  'beer_garden',
  'bistro',
  'brewery',
  'brewpub',
  'cafe',
  'cafeteria',
  'cake_shop',
  'candy_store',
  'cat_cafe',
  'chocolate_factory',
  'chocolate_shop',
  'cocktail_bar',
  'coffee_roastery',
  'coffee_shop',
  'coffee_stand',
  'confectionery',
  'deli',
  'dessert_shop',
  'diner',
  'dog_cafe',
  'donut_shop',
  'food',
  'food_court',
  'gastropub',
  'hot_dog_stand',
  'ice_cream_shop',
  'juice_shop',
  'lounge_bar',
  'meal_delivery',
  'meal_takeaway',
  'pizza_delivery',
  'pub',
  'restaurant',
  'sandwich_shop',
  'snack_bar',
  'sports_bar',
  'steak_house',
  'tea_house',
  'wine_bar',
  'winery',
]);

function isFoodAndDrinkPlace(place: NonNullable<GoogleTextSearchResponse['places']>[number]) {
  const types = new Set(
    [place.primaryType, ...(place.types ?? [])].filter((type): type is string => {
      return Boolean(type);
    }),
  );

  return [...types].some((type) => {
    return FOOD_AND_DRINK_EXACT_TYPES.has(type) || type.endsWith('_restaurant');
  });
}

@Injectable()
export class PlacesService {
  constructor(private readonly configService: ConfigService) {}

  async searchText(query: string): Promise<PlaceSearchResult[]> {
    const apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException('GOOGLE_PLACES_API_KEY is not configured');
    }

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.primaryType,places.primaryTypeDisplayName,places.types,places.photos',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'ja',
        regionCode: 'JP',
      }),
    });

    const data = (await response.json()) as GoogleTextSearchResponse;

    if (!response.ok) {
      throw new InternalServerErrorException(
        data.error?.message ?? 'Failed to search places',
      );
    }

    const places = (data.places ?? []).filter((place) => {
      return place.id && place.displayName?.text && isFoodAndDrinkPlace(place);
    });

    return Promise.all(
      places.map(async (place) => ({
        id: place.id!,
        name: place.displayName!.text!,
        address: place.formattedAddress ?? '',
        category: place.primaryTypeDisplayName?.text ?? '飲食店',
        photo: await this.getPhotoUri(place.photos?.[0]?.name, apiKey),
      })),
    );
  }

  private async getPhotoUri(photoName: string | undefined, apiKey: string) {
    if (!photoName) {
      return undefined;
    }

    const url = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
    url.searchParams.set('maxWidthPx', '600');
    url.searchParams.set('skipHttpRedirect', 'true');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url);

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as GooglePhotoMediaResponse;

    return data.photoUri;
  }
}
