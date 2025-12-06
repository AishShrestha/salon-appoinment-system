import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { BreakPeriodService } from './break-period.service';
import { CreateBreakPeriodDto } from './dto';
import { Auth } from '../auth/decorators';
import { UserRole } from '../../common/enums';

@ApiTags('break-periods')
@Controller('break-period')
export class BreakPeriodController {
  constructor(private readonly breakPeriodService: BreakPeriodService) {}

  /**
   * Create a new break period (admin only)
   */
  @Post()
  @Auth(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new break period (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Break period created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data (e.g., start time >= end time)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  async create(@Body() createBreakPeriodDto: CreateBreakPeriodDto) {
    return this.breakPeriodService.create(createBreakPeriodDto);
  }

  /**
   * Get all break periods
   */
  @Get()
  @ApiOperation({ summary: 'Get all break periods' })
  @ApiResponse({
    status: 200,
    description: 'Break periods retrieved successfully',
  })
  async findAll() {
    return this.breakPeriodService.findAll();
  }

  /**
   * Get a single break period by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a break period by ID' })
  @ApiResponse({
    status: 200,
    description: 'Break period retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Break period not found' })
  async findOne(@Param('id') id: string) {
    return this.breakPeriodService.findOne(+id);
  }

  /**
   * Delete a break period (admin only)
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a break period (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Break period deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  @ApiResponse({ status: 404, description: 'Break period not found' })
  async remove(@Param('id') id: string) {
    return this.breakPeriodService.remove(+id);
  }
}
