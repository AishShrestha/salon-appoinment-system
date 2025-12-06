import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Appointment } from './entities/appointment.entity';
import { Service } from '../service/entities/service.entity';
import { BreakPeriod } from '../break-period/entities/break-period.entity';
import {
  CreateAppointmentDto,
  GetAvailabilityDto,
  FilterAppointmentsDto,
} from './dto';
import {
  calculateAvailableSlots,
  calculateEndTime,
  doSlotsOverlap,
  validateTimeFormat,
  validateDateFormat,
  isDateInPast,
  BookingSlot,
  TimeSlot,
} from '../../common/utils';
import { AppointmentStatus } from '../../common/enums';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  // Business hours configuration
  private readonly businessHours = {
    start: '09:00',
    end: '18:00',
  };

  private readonly slotIncrement = 15;

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(BreakPeriod)
    private readonly breakPeriodRepository: Repository<BreakPeriod>,
    @InjectQueue('notification') private readonly notificationQueue: Queue,
  ) {}

  /**
   * Get all bookings for a specific date
   * @param date - Date in YYYY-MM-DD format
   * @returns Array of appointments
   */
  async getBookingsForDate(date: string): Promise<Appointment[]> {
    validateDateFormat(date);

    return this.appointmentRepository.find({
      where: { date: new Date(date) },
      relations: ['service', 'user'],
      order: { startTime: 'ASC' },
    });
  }

  /**
   * Get availability for a service on a specific date
   * @param getAvailabilityDto - Service ID and date
   * @returns Available and booked slots
   */
  async getAvailability(getAvailabilityDto: GetAvailabilityDto): Promise<{
    date: string;
    service: { id: number; name: string; duration: number };
    slots: BookingSlot[];
  }> {
    const { serviceId, date } = getAvailabilityDto;

    // Validate inputs
    validateDateFormat(date);

    if (isDateInPast(date)) {
      throw new BadRequestException('Cannot book appointments in the past');
    }

    // Get service
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    // Get existing bookings for the date
    const bookings = await this.getBookingsForDate(date);
    const existingBookings: TimeSlot[] = bookings.map((booking) => ({
      start: booking.startTime,
      end: booking.endTime,
    }));

    // Get break periods
    const breakPeriods = await this.breakPeriodRepository.find();
    const breakTimes: TimeSlot[] = breakPeriods.map((bp) => ({
      start: bp.startTime,
      end: bp.endTime,
    }));

    // Calculate available slots
    const slots = calculateAvailableSlots(
      this.businessHours,
      service.duration,
      existingBookings,
      breakTimes,
      this.slotIncrement,
    );

    this.logger.log(
      `Calculated ${slots.length} slots for service ${service.name} on ${date}`,
    );

    return {
      date,
      service: {
        id: service.id,
        name: service.name,
        duration: service.duration,
      },
      slots,
    };
  }

  /**
   * Create a new appointment
   * @param createAppointmentDto - Appointment data
   * @param userId - ID of user making the booking
   * @returns Created appointment
   */
  async create(
    createAppointmentDto: CreateAppointmentDto,
    userId: number,
  ): Promise<Appointment> {
    const { serviceId, date, startTime, notes } = createAppointmentDto;

    try {
      // Validate inputs
      validateDateFormat(date);
      validateTimeFormat(startTime);

      if (isDateInPast(date)) {
        throw new BadRequestException('Cannot book appointments in the past');
      }

      // Get service
      const service = await this.serviceRepository.findOne({
        where: { id: serviceId },
      });

      if (!service) {
        throw new NotFoundException(`Service with ID ${serviceId} not found`);
      }

      // Calculate end time
      const endTime = calculateEndTime(startTime, service.duration);

      // Validate slot is within business hours
      if (!this.isSlotWithinBusinessHours(startTime, endTime)) {
        throw new BadRequestException(
          `Booking must be within business hours (${this.businessHours.start} - ${this.businessHours.end})`,
        );
      }

      // Check for overlapping bookings
      await this.validateNoOverlap(date, startTime, endTime);

      // Check if slot is in break time
      await this.validateNotInBreakTime(startTime, endTime);

      // Create appointment with auto-confirm
      const appointment = this.appointmentRepository.create({
        userId,
        serviceId,
        date: new Date(date),
        startTime,
        endTime,
        status: AppointmentStatus.CONFIRMED,
        ...(notes && { notes }),
      });

      const savedAppointment =
        await this.appointmentRepository.save(appointment);

      this.logger.log(
        `Appointment created and confirmed: ID ${savedAppointment.id} for user ${userId}`,
      );

      // Queue confirmation notification
      await this.queueBookingConfirmation(savedAppointment, service);

      if (!appointment) {
        throw new InternalServerErrorException(
          'Failed to retrieve created appointment',
        );
      }

      return appointment;
    } catch (error) {
      if (error.status) {
        throw error;
      }

      this.logger.error(
        `Failed to create appointment: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to create appointment. Please try again later.',
      );
    }
  }

  /**
   * Get all appointments with optional filters
   * @param filterDto - Filter criteria
   * @returns Array of appointments
   */
  async findAll(filterDto?: FilterAppointmentsDto): Promise<Appointment[]> {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.user', 'user');

    if (filterDto?.status) {
      queryBuilder.andWhere('appointment.status = :status', {
        status: filterDto.status,
      });
    }

    if (filterDto?.date) {
      validateDateFormat(filterDto.date);
      queryBuilder.andWhere('appointment.date = :date', {
        date: filterDto.date,
      });
    }

    return queryBuilder
      .orderBy('appointment.date', 'ASC')
      .addOrderBy('appointment.startTime', 'ASC')
      .getMany();
  }

  /**
   * Get user's appointments
   * @param userId - User ID
   * @returns Array of user's appointments
   */
  async findByUser(userId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { userId },
      relations: ['service'],
      order: { date: 'DESC', startTime: 'DESC' },
    });
  }

  /**
   * Cancel an appointment
   * @param id - Appointment ID
   * @param userId - User ID (for authorization)
   * @returns Updated appointment
   */
  async cancel(id: number, userId: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['service', 'user'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    if (appointment.userId !== userId) {
      throw new BadRequestException(
        'You can only cancel your own appointments',
      );
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    return this.appointmentRepository.save(appointment);
  }

  /**
   * Get a single appointment by ID (admin only)
   * @param id - Appointment ID
   * @returns Appointment with all relations
   */
  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['service', 'user'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  /**
   * Mark appointment as completed (admin only)
   * @param id - Appointment ID
   * @returns Updated appointment
   */
  async markCompleted(id: number): Promise<Appointment> {
    try {
      const appointment = await this.findOne(id);

      // Can only complete confirmed appointments
      if (appointment.status !== AppointmentStatus.CONFIRMED) {
        throw new BadRequestException(
          'Only confirmed appointments can be marked as completed',
        );
      }

      appointment.status = AppointmentStatus.COMPLETED;

      const updatedAppointment =
        await this.appointmentRepository.save(appointment);

      this.logger.log(`Appointment ${id} marked as completed by admin`);

      return updatedAppointment;
    } catch (error) {
      if (error.status) {
        throw error;
      }

      this.logger.error(
        `Failed to mark appointment ${id} as completed: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to mark appointment as completed. Please try again later.',
      );
    }
  }

  /**
   * Queue notification for status change
   */
  private async queueStatusChangeNotification(
    appointment: Appointment,
    action: 'confirmed' | 'cancelled',
  ): Promise<void> {
    try {
      // For confirmation, use booking-confirmation job type
      const jobType =
        action === 'confirmed' ? 'booking-confirmation' : 'status-change';

      await this.notificationQueue.add(
        jobType,
        {
          appointmentId: appointment.id,
          userId: appointment.userId,
          serviceName: appointment.service?.name,
          action,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          date: appointment.date,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(
        `Status change notification queued for appointment ${appointment.id}`,
      );
    } catch (error) {
      // Don't fail status update if notification fails
      this.logger.error(
        `Failed to queue status change notification for appointment ${appointment.id}`,
        error.stack,
      );
    }
  }

  /**
   * Check if slot is within business hours
   */
  private isSlotWithinBusinessHours(
    startTime: string,
    endTime: string,
  ): boolean {
    return (
      !doSlotsOverlap(startTime, endTime, '00:00', this.businessHours.start) &&
      !doSlotsOverlap(startTime, endTime, this.businessHours.end, '23:59')
    );
  }

  /**
   * Validate no overlapping bookings exist
   */
  private async validateNoOverlap(
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<void> {
    const existingBookings = await this.getBookingsForDate(date);

    const hasOverlap = existingBookings.some((booking) =>
      doSlotsOverlap(startTime, endTime, booking.startTime, booking.endTime),
    );

    if (hasOverlap) {
      throw new BadRequestException(
        'This time slot overlaps with an existing booking. Please choose another time.',
      );
    }
  }

  /**
   * Validate slot is not in break time
   */
  private async validateNotInBreakTime(
    startTime: string,
    endTime: string,
  ): Promise<void> {
    const breakPeriods = await this.breakPeriodRepository.find();

    const isInBreak = breakPeriods.some((bp) =>
      doSlotsOverlap(startTime, endTime, bp.startTime, bp.endTime),
    );

    if (isInBreak) {
      throw new BadRequestException(
        'This time slot overlaps with a break period. Please choose another time.',
      );
    }
  }

  /**
   * Queue booking confirmation notification
   */
  private async queueBookingConfirmation(
    appointment: Appointment,
    service: Service,
  ): Promise<void> {
    try {
      await this.notificationQueue.add(
        'booking-confirmation',
        {
          appointmentId: appointment.id,
          userId: appointment.userId,
          serviceName: service.name,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(`Notification queued for appointment ${appointment.id}`);
    } catch (error) {
      // Don't fail booking if notification fails
      this.logger.error(
        `Failed to queue notification for appointment ${appointment.id}`,
        error.stack,
      );
    }
  }
}
