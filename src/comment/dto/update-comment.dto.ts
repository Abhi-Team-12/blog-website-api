import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ description: 'Comment content', required: false })
  @IsString()
  @IsOptional()
  content?: string;
}