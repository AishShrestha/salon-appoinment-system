import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ServiceService } from './service.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { Auth } from '../auth/decorators';
import { UserRole } from '../../common/enums';

/**
 * ServiceController - RESTful endpoints for service management
 */
@ApiTags('services')
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  /**
   * Create a new service (admin only)
   */
  @Post()
  @Auth(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service (admin only)' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  async create(@Body() createServiceDto: CreateServiceDto) {
    return this.serviceService.create(createServiceDto);
  }

  /**
   * Get all services
   * Public endpoint - no authentication required
   */
  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async findAll() {
    return this.serviceService.findAll();
  }

  /**
   * Get a single service by ID
   * Public endpoint - no authentication required
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(@Param('id') id: string) {
    return this.serviceService.findOne(+id);
  }

  /**
   * Update a service (admin only)
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service (admin only)' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.serviceService.update(+id, updateServiceDto);
  }

  /**
   * Delete a service (admin only)
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a service (admin only)' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(@Param('id') id: string) {
    return this.serviceService.remove(+id);
  }
}
