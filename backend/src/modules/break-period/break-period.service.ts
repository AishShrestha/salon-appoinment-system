import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BreakPeriod } from './entities/break-period.entity';
import { CreateBreakPeriodDto } from './dto';
import { timeToMinutes } from '../../common/utils';

/**
 * BreakPeriodService - Handles break time management
 * Follows Single Responsibility Principle
 */
@Injectable()
export class BreakPeriodService {
  private readonly logger = new Logger(BreakPeriodService.name);

  constructor(
    @InjectRepository(BreakPeriod)
    private readonly breakPeriodRepository: Repository<BreakPeriod>,
  ) {}

  /**
   * Create a new break period
   * @param createBreakPeriodDto - Break period data
   * @returns Created break period
   */
  async create(
    createBreakPeriodDto: CreateBreakPeriodDto,
  ): Promise<BreakPeriod> {
    const { startTime, endTime } = createBreakPeriodDto;

    try {
      // Validate start < end
      if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
        throw new BadRequestException('Start time must be before end time');
      }

      const breakPeriod =
        this.breakPeriodRepository.create(createBreakPeriodDto);
      const savedBreakPeriod =
        await this.breakPeriodRepository.save(breakPeriod);

      this.logger.log(
        `Break period created: ${startTime} - ${endTime} (ID: ${savedBreakPeriod.id})`,
      );
      return savedBreakPeriod;
    } catch (error) {
      if (error.status) {
        throw error;
      }

      this.logger.error(
        `Failed to create break period: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to create break period. Please try again later.',
      );
    }
  }

  /**
   * Get all break periods
   * @returns Array of all break periods
   */
  async findAll(): Promise<BreakPeriod[]> {
    return this.breakPeriodRepository.find({
      order: { startTime: 'ASC' },
    });
  }

  /**
   * Get a single break period by ID
   * @param id - Break period ID
   * @returns Break period entity
   */
  async findOne(id: number): Promise<BreakPeriod> {
    const breakPeriod = await this.breakPeriodRepository.findOne({
      where: { id },
    });

    if (!breakPeriod) {
      throw new NotFoundException(`Break period with ID ${id} not found`);
    }

    return breakPeriod;
  }

  /**
   * Delete a break period
   * @param id - Break period ID
   */
  async remove(id: number): Promise<void> {
    try {
      // Check if break period exists
      const breakPeriod = await this.findOne(id);

      await this.breakPeriodRepository.remove(breakPeriod);
      this.logger.log(
        `Break period deleted: ${breakPeriod.startTime} - ${breakPeriod.endTime} (ID: ${id})`,
      );
    } catch (error) {
      if (error.status) {
        throw error;
      }

      this.logger.error(
        `Failed to delete break period ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to delete break period. Please try again later.',
      );
    }
  }
}
