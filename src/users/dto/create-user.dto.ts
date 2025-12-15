import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Abhishek Singh',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'abhishek@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contact number of the user',
    example: '+91-9876543210',
  })
  @IsString()
  @IsNotEmpty()
  contact: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'strongPassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

}
