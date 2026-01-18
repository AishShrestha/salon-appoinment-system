import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CompletePaymentDto {
  @ApiProperty({
    example: 'pidx123456789',
    description: 'Khalti payment identifier (pidx)',
  })
  @IsString()
  @IsNotEmpty()
  pidx: string;

  @ApiProperty({ example: 1, description: 'Order/Appointment/Booking ID' })
  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}
