import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'abhishek@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'strongPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string; // Correctly typed as string
}
