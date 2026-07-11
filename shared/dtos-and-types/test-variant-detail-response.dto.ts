import { ApiProperty } from "@nestjs/swagger";
import type { Prisma } from "@prisma/client";

export interface TestVariantDetail {
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
  questions: Array<{
    id: string;
    text: string;
    options: Prisma.JsonValue;
    testId: string;
  }>;
}

export class TestVariantDetailResponseDto {
  @ApiProperty({ description: "The unique ULID of the test variant" })
  id: string;

  @ApiProperty({ description: "The ID of the parent test" })
  testId: string;

  @ApiProperty({ description: "Tier name (SMALL, MEDIUM, LARGE)" })
  tierName: string;

  @ApiProperty({ description: "CPE credit hours awarded" })
  hours: number;

  @ApiProperty({ description: "Allowed test duration in minutes" })
  duration: number;

  @ApiProperty({ description: "Number of questions in this variant" })
  questionCount: number;

  @ApiProperty({ description: "Price in USD" })
  price: number;

  @ApiProperty({ description: "Parent test details" })
  test: {
    id: string;
    title: string;
    arabicTitle?: string | null;
    englishTitle?: string | null;
    cert: string;
    desc: string;
  };

  @ApiProperty({ description: "Questions included in this test variant" })
  questions: Array<{
    id: string;
    text: string;
    options: Prisma.JsonValue;
    testId: string;
  }>;

  constructor(variant: TestVariantDetail) {
    this.id = variant.id;
    this.testId = variant.testId;
    this.tierName = variant.tierName;
    this.hours = variant.hours;
    this.duration = variant.duration;
    this.questionCount = variant.questionCount;
    this.price = variant.price;
    this.test = variant.test;
    this.questions = variant.questions;
  }
}
