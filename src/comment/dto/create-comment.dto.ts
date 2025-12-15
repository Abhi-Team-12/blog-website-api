import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'Post ID' })
  @IsNumber()
  @IsNotEmpty()
  post_id: number;

  @ApiProperty({ description: 'Comment content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Parent comment ID for replies', required: false })
  @IsNumber()
  @IsOptional()
  parent_id?: number;
}