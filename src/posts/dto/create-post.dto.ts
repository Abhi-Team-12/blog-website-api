import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'Title of the post', example: 'My First Blog Post' })
  title: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'my-first-blog-post' })
  slug: string;

  @ApiProperty({ description: 'Content of the blog post', example: 'This is content...' })
  content: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file for the post',
  })
  image?: any;

  @ApiProperty({ description: 'Category ID', example: 1 })
  category_id: number;

  @ApiProperty({ description: 'Tag ID', example: 1 })
  tag_id: number;

  @ApiPropertyOptional({ description: 'Post status', example: 'draft' })
  status?: 'draft' | 'scheduled' | 'published';

  @ApiPropertyOptional({ description: 'Scheduled time for the post', example: '2025-10-10T10:00:00Z' })
  scheduled_at?: Date;
}
