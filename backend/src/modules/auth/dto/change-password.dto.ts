import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'currentPassword123',
    description: 'Current password of the user',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword: string;

  @ApiProperty({
    example: 'newSecurePassword456',
    description: 'New password to set',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}
