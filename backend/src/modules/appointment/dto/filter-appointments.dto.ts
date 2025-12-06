import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../../../common/enums';

export class FilterAppointmentsDto {
  @ApiProperty({
    description: 'Filter by status',
    enum: AppointmentStatus,
    required: false,
  })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiProperty({
    description: 'Filter by date (YYYY-MM-DD)',
    example: '2025-12-10',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  date?: string;
}
