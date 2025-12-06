import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for bulk appointment upload response
 */
export class BulkUploadResponseDto {
  @ApiProperty({ description: 'Bulk job ID' })
  jobId: number;

  @ApiProperty({ description: 'Total records in the file' })
  totalRecords: number;

  @ApiProperty({ description: 'Job status' })
  status: string;

  @ApiProperty({ description: 'Message' })
  message: string;
}

/**
 * DTO for bulk job status
 */
export class BulkJobStatusDto {
  @ApiProperty({ description: 'Job ID' })
  id: number;

  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'Total records' })
  totalRecords: number;

  @ApiProperty({ description: 'Processed records' })
  processedRecords: number;

  @ApiProperty({ description: 'Success count' })
  successCount: number;

  @ApiProperty({ description: 'Failure count' })
  failureCount: number;

  @ApiProperty({ description: 'Job status' })
  status: string;

  @ApiProperty({ description: 'Error message', required: false })
  errorMessage?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Progress percentage' })
  progress: number;
}
