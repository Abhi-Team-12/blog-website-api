import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({
    description: 'Name of the tag',
    example: 'Tag',
  })
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the tag',
    example: 'tag',
  })
  slug: string;
}
