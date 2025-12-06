import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBreakPeriodDto {
  @ApiProperty({
    description: 'Start time of break (HH:MM in 24-hour format)',
    example: '12:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:MM format (24-hour)',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time of break (HH:MM in 24-hour format)',
    example: '13:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in HH:MM format (24-hour)',
  })
  endTime: string;
}
