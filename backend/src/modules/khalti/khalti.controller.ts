import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { KhaltiService } from './khalti.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CompletePaymentDto } from './dto/complete-payment.dto';
import { UserRole } from 'src/common/enums';
import { Auth } from 'src/modules/auth/decorators';

@ApiTags('Khalti')
@Controller('khalti')
export class KhaltiController {
  constructor(private readonly khaltiService: KhaltiService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate Khalti payment' })
  @ApiBody({ type: InitiatePaymentDto })
  @ApiResponse({ status: 201, description: 'Payment initiated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  initiate(@Body() dto: InitiatePaymentDto) {
    return this.khaltiService.initiatePayment(
      dto.amount,
      dto.purchaseOrderId,
      dto.purchaseOrderName,
      dto.returnUrl,
    );
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify Khalti payment' })
  @ApiBody({ type: VerifyPaymentDto })
  @ApiResponse({ status: 200, description: 'Payment verified successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  verify(@Body() dto: VerifyPaymentDto) {
    return this.khaltiService.verifyPayment(dto.pidx);
  }

  /**
   * Complete payment after Khalti verification.
   * Ensures idempotency and backend verification.
   * @param dto CompletePaymentDto
   * @param req Request (for userId extraction)
   */
  @Auth(UserRole.USER, UserRole.ADMIN)
  @Post('/payments/complete')
  @ApiOperation({ summary: 'Complete payment after Khalti verification' })
  @ApiBody({ type: CompletePaymentDto })
  @ApiResponse({ status: 200, description: 'Payment processed successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Payment not completed or invalid.',
  })
  async completePayment(@Body() dto: CompletePaymentDto, @Req() req: any) {
    const userId = req.user?.id;

    return this.khaltiService.completePayment({
      pidx: dto.pidx,
      orderId: dto.orderId,
      userId: Number(userId),
    });
  }
}
