import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BreakPeriod } from './entities/break-period.entity';
import { BreakPeriodController } from './break-period.controller';
import { BreakPeriodService } from './break-period.service';

@Module({
  imports: [TypeOrmModule.forFeature([BreakPeriod])],
  controllers: [BreakPeriodController],
  providers: [BreakPeriodService],
  exports: [TypeOrmModule, BreakPeriodService],
})
export class BreakPeriodModule {}
