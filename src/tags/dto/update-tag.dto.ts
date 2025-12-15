import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTagDto } from './create-tag.dto';

export class UpdateTagDto extends PartialType(CreateTagDto) {
  @ApiPropertyOptional({
    description: 'Update Name of the tag',
    example: 'updated Tag',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Update URL-friendly slug for the tag',
    example: 'updated-tag',
  })
  slug?: string;
}
