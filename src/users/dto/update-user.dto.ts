import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'Abhishek Singh',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Contact number of the user',
    example: '+91-9876543210',
  })
  @IsString()
  @IsOptional()
  contact?: string;

  @ApiPropertyOptional({
    description: 'Password for the user account',
    example: 'newStrongPassword123',
  })
  @IsString()
  @IsOptional()
  password?: string;
}
