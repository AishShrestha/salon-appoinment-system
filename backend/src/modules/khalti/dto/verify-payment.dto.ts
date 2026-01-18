import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({
    example: 'pidx123456789',
    description: 'Khalti payment identifier (pidx)',
  })
  @IsString()
  @IsNotEmpty()
  pidx: string;
}
