import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
  Matches,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'Service ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  serviceId: number;

  @ApiProperty({
    description: 'Booking date (YYYY-MM-DD)',
    example: '2025-12-10',
  })
  @IsDateString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({
    description: 'Start time (HH:MM in 24-hour format)',
    example: '10:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:MM format (24-hour)',
  })
  startTime: string;

  @ApiProperty({
    description: 'Optional notes for the appointment',
    example: 'Please use organic products',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
