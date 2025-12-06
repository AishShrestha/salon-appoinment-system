import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BulkJob } from './entities/bulk-job.entity';
import { BulkJobLog } from './entities/bulk-job-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BulkJob, BulkJobLog])],
  exports: [TypeOrmModule],
})
export class BulkJobModule {}
