import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty({
    example: 1000,
    description: 'Amount in paisa (e.g., 1000 = NPR 10)',
  })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'ORDER123', description: 'Unique purchase order ID' })
  @IsString()
  @IsNotEmpty()
  purchaseOrderId: string;

  @ApiProperty({
    example: 'Salon Booking',
    description: 'Name of the purchase order',
  })
  @IsString()
  @IsNotEmpty()
  purchaseOrderName: string;

  @ApiProperty({
    example: 'http://localhost:3000/return',
    description: 'URL to redirect after payment',
  })
  @IsUrl()
  returnUrl: string;
}
