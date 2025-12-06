import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BreakPeriod } from './entities/break-period.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BreakPeriod])],
  exports: [TypeOrmModule],
})
export class BreakPeriodModule {}
