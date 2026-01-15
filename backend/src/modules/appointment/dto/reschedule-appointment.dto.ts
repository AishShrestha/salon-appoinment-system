import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  Matches,
  IsOptional,
} from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({
    example: '2026-01-20',
    description: 'New appointment date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '10:00', description: 'New start time (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:mm format',
  })
  @IsNotEmpty()
  startTime: string;

  @ApiPropertyOptional({
    example: 'Need to change due to conflict',
    description: 'Optional reschedule reason/notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
