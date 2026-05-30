export class UpsertRestaurantDto {
  id!: string;
  name!: string;
  photo?: string;
  status!: 'visited' | 'want';
  rating!: number;
  visitDate?: string;
  memo!: string;
  floor!: '1F' | '2F+';
  elevator!: 'yes' | 'no' | 'unknown';
  category!: string;
  address!: string;
}
