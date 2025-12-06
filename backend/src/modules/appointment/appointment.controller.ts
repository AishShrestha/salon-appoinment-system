import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import {
  CreateAppointmentDto,
  GetAvailabilityDto,
  FilterAppointmentsDto,
} from './dto';
import { Auth, Roles } from '../auth/decorators';
import { UserRole } from '../../common/enums';

@ApiTags('appointments')
@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  /**
   * Get available time slots for a service on a specific date
   */
  @Get('availability')
  @ApiOperation({ summary: 'Get available time slots for booking' })
  @ApiResponse({
    status: 200,
    description: 'Available slots retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async getAvailability(@Query() getAvailabilityDto: GetAvailabilityDto) {
    return this.appointmentService.getAvailability(getAvailabilityDto);
  }

  /**
   * Create a new appointment
   * Requires authentication - user must be logged in
   */
  @Post()
  @Auth(UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid booking data or time slot unavailable',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.appointmentService.create(createAppointmentDto, userId);
  }

  /**
   * Get all appointments (admin only) or filtered appointments
   */
  @Get()
  @Auth(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all appointments (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Appointments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  async findAll(@Query() filterDto?: FilterAppointmentsDto) {
    return this.appointmentService.findAll(filterDto);
  }

  /**
   * Get current user's appointments
   */
  @Get('my-appointments')
  @Auth(UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's appointments" })
  @ApiResponse({
    status: 200,
    description: 'User appointments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyAppointments(@Req() req: any) {
    const userId = req.user.id;
    return this.appointmentService.findByUser(userId);
  }

  /**
   * Cancel an appointment
   */
  @Delete(':id')
  @Auth() // Requires authentication
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Cannot cancel appointment (already cancelled or not owned by user)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async cancel(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.appointmentService.cancel(+id, userId);
  }

  /**
   * Get a single appointment by ID (admin only)
   */
  @Get(':id')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointment details by ID ' })
  @ApiResponse({
    status: 200,
    description: 'Appointment retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findOneAdmin(@Param('id') id: string) {
    return this.appointmentService.findOne(+id);
  }

  /**
   * Mark appointment as completed (admin only)
   * Used after service delivery to mark appointment as done
   */
  @Patch(':id/complete')
  @Auth(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark appointment as completed (admin only)',
    description:
      'Mark a confirmed appointment as completed after service delivery',
  })
  @ApiResponse({
    status: 200,
    description: 'Appointment marked as completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Can only complete confirmed appointments',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async completeAppointment(@Param('id') id: string) {
    return this.appointmentService.markCompleted(+id);
  }
}
