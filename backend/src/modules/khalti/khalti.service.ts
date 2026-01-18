import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import axios from 'axios';
import { Appointment } from '../appointment/entities/appointment.entity';
import { Payment } from './entities/payment.entity';

@Injectable()
export class KhaltiService {
  private khalti;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {
    this.khalti = axios.create({
      baseURL: this.configService.get<string>('KHALTI_BASE_URL'),
      headers: {
        Authorization: `Key ${this.configService.get<string>('KHALTI_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
    });
  }
  /**
   * Complete payment after Khalti verification.
   * Ensures idempotency and atomicity using a DB transaction.
   * @param pidx Khalti payment identifier
   * @param orderId Appointment ID
   * @param userId User ID (for ownership validation)
   */
  async completePayment({
    pidx,
    orderId,
    userId,
  }: {
    pidx: string;
    orderId: number;
    userId: number;
  }) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Fetch appointment and validate ownership
      const appointment = await manager
        .getRepository(Appointment)
        .findOne({ where: { id: orderId, userId } });
      if (!appointment)
        throw new BadRequestException('Appointment not found or access denied');

      // 2. Check if payment already processed (idempotency)
      const existingPayment = await manager
        .getRepository(Payment)
        .findOne({ where: { pidx } });
      if (existingPayment) {
        // Idempotency is required to prevent duplicate records and double-processing in case of retries or network issues.
        return {
          status: 'SUCCESS',
          message: 'Payment already processed',
          payment: existingPayment,
        };
      }

      // 3. Verify payment with Khalti (server-side only)
      const khaltiResponse = await this.verifyPayment(pidx);
      // Backend verification is mandatory to prevent spoofed/forged payment status from the client.

      if (khaltiResponse.status !== 'Completed') {
        throw new BadRequestException('Payment not completed on Khalti');
      }

      // 4. Validate amount matches appointment's service price
      await manager
        .getRepository(Appointment)
        .findOneOrFail({ where: { id: orderId }, relations: ['service'] });
      const service = await manager
        .getRepository('Service')
        .findOne({ where: { id: appointment.serviceId } });
      if (!service)
        throw new BadRequestException('Service not found for appointment');
      const expectedAmount = Math.round(Number(service.price) * 100); // price in paisa
      if (expectedAmount !== Number(khaltiResponse.amount)) {
        throw new BadRequestException('Payment amount mismatch');
      }

      // 5. Persist payment record

      const payment = manager.getRepository(Payment).create({
        pidx,
        gateway: 'KHALTI',
        amount: khaltiResponse.amount,
        status: 'SUCCESS',
        rawResponse: khaltiResponse,
      });
      const savedPayment = await manager.getRepository(Payment).save(payment);

      // 6. Link payment to appointment
      appointment.paymentId = savedPayment.id;
      appointment.payment = savedPayment;
      await manager.getRepository(Appointment).save(appointment);

      // 7. Return confirmation
      return {
        status: 'SUCCESS',
        message: 'Payment processed successfully',
        payment,
        appointment,
        khaltiResponse,
      };
    });
  }

  async initiatePayment(
    amount: number,
    purchaseOrderId: string,
    purchaseOrderName: string,
    returnUrl: string,
  ) {
    try {
      const response = await this.khalti.post('/epayment/initiate/', {
        return_url: returnUrl,
        website_url: 'http://localhost:3000',
        amount, // amount in paisa
        purchase_order_id: purchaseOrderId,
        purchase_order_name: purchaseOrderName,
      });

      return response.data;
    } catch (error) {
      console.log('Khalti Initiate Payment Error:', error);
      throw new BadRequestException(
        error.response?.data || 'Khalti payment initiation failed',
      );
    }
  }

  async verifyPayment(pidx: string) {
    try {
      const response = await this.khalti.post('/epayment/lookup/', {
        pidx,
      });

      return response.data;
    } catch (error) {
      throw new BadRequestException(
        error.response?.data || 'Khalti payment verification failed',
      );
    }
  }
}
