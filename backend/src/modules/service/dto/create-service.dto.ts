import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsNumber,
  Max,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Haircut',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 60,
    minimum: 15,
  })
  @IsInt()
  @Min(15, { message: 'Duration must be at least 15 minutes' })
  @Max(480, { message: 'Duration cannot exceed 8 hours' })
  duration: number;

  @ApiProperty({
    description: 'Service price',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;
}
