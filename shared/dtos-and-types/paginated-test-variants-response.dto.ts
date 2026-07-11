import { ApiProperty } from '@nestjs/swagger';

export interface TestVariantItem {
  id: string;
  testId: string;
  tierName: string;
  hours: number;
  duration: number;
  questionCount: number;
  price: number;
  test: {
    id: string;
    title: string;
    arabicTitle?: string | null;
    englishTitle?: string | null;
    cert: string;
    desc: string;
  };
}

export class PaginatedTestVariantsResponseDto {
  @ApiProperty({ description: 'List of test variants' })
  items: TestVariantItem[];

  @ApiProperty({ description: 'List of test variants' })
  data: TestVariantItem[];

  @ApiProperty({ description: 'Total count of test variants matching query' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page limit' })
  limit: number;

  @ApiProperty({ description: 'Whether more pages are available' })
  hasMore: boolean;

  constructor(payload: {
    items: TestVariantItem[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }) {
    this.items = payload.items;
    this.data = payload.items;
    this.total = payload.total;
    this.page = payload.page;
    this.limit = payload.limit;
    this.hasMore = payload.hasMore;
  }
}
