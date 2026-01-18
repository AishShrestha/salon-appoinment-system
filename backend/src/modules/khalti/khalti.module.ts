import { Module } from '@nestjs/common';
import { KhaltiService } from './khalti.service';
import { KhaltiController } from './khalti.controller';
import { Appointment } from 'src/modules/appointment/entities/appointment.entity';
import { Payment } from './entities/payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Appointment])],
  providers: [KhaltiService],
  controllers: [KhaltiController],
})
export class KhaltiModule {}
