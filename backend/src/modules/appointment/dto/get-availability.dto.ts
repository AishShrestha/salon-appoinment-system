import { IsNotEmpty, IsDateString, IsInt, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetAvailabilityDto {
  @ApiProperty({
    description: 'Service ID to check availability for',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  serviceId: number;

  @ApiProperty({
    description: 'Date to check availability (YYYY-MM-DD)',
    example: '2025-12-10',
  })
  @IsDateString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;
}
