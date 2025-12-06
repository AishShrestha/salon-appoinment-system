import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto';

/**
 * ServiceService - Handles CRUD operations for services
 * Follows Single Responsibility Principle
 */
@Injectable()
export class ServiceService {
  private readonly logger = new Logger(ServiceService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  /**
   * Create a new service
   * @param createServiceDto - Service data
   * @returns Created service
   */
  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    try {
      const service = this.serviceRepository.create(createServiceDto);
      const savedService = await this.serviceRepository.save(service);

      this.logger.log(
        `Service created: ${savedService.name} (ID: ${savedService.id})`,
      );
      return savedService;
    } catch (error) {
      this.logger.error(
        `Failed to create service: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to create service. Please try again later.',
      );
    }
  }

  /**
   * Get all services
   * @returns Array of all services
   */
  async findAll(): Promise<Service[]> {
    return this.serviceRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Get a single service by ID
   * @param id - Service ID
   * @returns Service entity
   */
  async findOne(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  /**
   * Update a service
   * @param id - Service ID
   * @param updateServiceDto - Updated service data
   * @returns Updated service
   */
  async update(
    id: number,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    try {
      // Check if service exists
      const service = await this.findOne(id);

      // Apply updates
      Object.assign(service, updateServiceDto);
      const updatedService = await this.serviceRepository.save(service);

      this.logger.log(`Service updated: ${updatedService.name} (ID: ${id})`);
      return updatedService;
    } catch (error) {
      if (error.status) {
        throw error;
      }

      this.logger.error(
        `Failed to update service ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to update service. Please try again later.',
      );
    }
  }

  /**
   * Delete a service
   * @param id - Service ID
   */
  async remove(id: number): Promise<void> {
    try {
      // Check if service exists
      const service = await this.findOne(id);

      await this.serviceRepository.remove(service);
      this.logger.log(`Service deleted: ${service.name} (ID: ${id})`);
    } catch (error) {
      if (error.status) {
        throw error;
      }

      this.logger.error(
        `Failed to delete service ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to delete service. Please try again later.',
      );
    }
  }
}
