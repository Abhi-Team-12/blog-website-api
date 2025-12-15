import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @ApiPropertyOptional({ description: 'Update Title of the post', example: 'Update My First Blog Post' })
  title?: string;

  @ApiPropertyOptional({ description: 'Update URL-friendly slug', example: 'update-my-first-blog-post' })
  slug?: string;

  @ApiPropertyOptional({ description: 'Update Content', example: 'Updated content...' })
  content?: string;

  @ApiPropertyOptional({ description: 'Update Image URL', example: 'https://example.com/images/post1.jpg' })
  image?: string;

  @ApiPropertyOptional({ description: 'Update Category ID', example: 2 })
  category_id?: number;

  @ApiPropertyOptional({ description: 'Update Scheduled Datetime', required: false })
  scheduled_at?: Date;
}
