import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { BulkAppointmentService } from './bulk-appointment.service';
import { Auth } from '../auth/decorators';
import { UserRole } from '../../common/enums';

@ApiTags('bulk-appointments')
@Controller('bulk-appointment')
export class BulkAppointmentController {
  constructor(
    private readonly bulkAppointmentService: BulkAppointmentService,
  ) {}

  /**
   * Upload Excel file for bulk appointment processing
   */
  @Post('upload')
  @Auth(UserRole.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload bulk appointments Excel file (admin only)',
    description: `Upload an Excel file containing multiple appointments for asynchronous processing.
    
    Expected Excel columns:
    - Customer Name (required)
    - Customer Email (required)
    - Service Name (required)
    - Date (required, format: YYYY-MM-DD)
    - Start Time (required, format: HH:MM)
    - Notes (optional)`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded and queued for processing',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  async uploadBulkFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.bulkAppointmentService.uploadBulkFile(file, userId);
  }

  /**
   * Get bulk job status
   */
  @Get('job/:id/status')
  @Auth(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get bulk job status (admin only)',
    description: 'Retrieve the current status and progress of a bulk job',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getJobStatus(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.bulkAppointmentService.getJobStatus(id, userId);
  }

  /**
   * Get bulk job logs
   */
  @Get('job/:id/logs')
  @Auth(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get bulk job logs (admin only)',
    description: 'Retrieve detailed logs for each appointment in the bulk job',
  })
  @ApiResponse({
    status: 200,
    description: 'Job logs retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getJobLogs(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.bulkAppointmentService.getJobLogs(id, userId);
  }

  /**
   * Get all bulk jobs
   */
  @Get('jobs')
  @Auth(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all bulk jobs (admin only)',
    description: 'Retrieve all bulk jobs for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Jobs retrieved successfully',
  })
  async getAllJobs(@Req() req: any) {
    const userId = req.user.id;
    return this.bulkAppointmentService.getAllJobs(userId);
  }
}
