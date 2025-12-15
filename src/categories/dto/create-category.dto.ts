import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Categoty',
  })
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the category',
    example: 'Categories',
  })
  slug: string;
}
