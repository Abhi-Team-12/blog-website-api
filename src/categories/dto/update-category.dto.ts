import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiPropertyOptional({
    description: 'Update Name of the category',
    example: 'category',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Update URL-friendly slug for the category',
    example: 'categories',
  })
  slug?: string;
}
