import { PawnTicketPaymentRepository } from '../../../../domains/pawnTicketPayment/PawnTicketPaymentRepository';
import { 
  GetPawnTicketPaymentsRequestDto, 
  getPawnTicketPaymentsRequestSchema 
} from '../../../dto/pawnTicketPayment/query/GetPawnTicketPaymentsRequestDto';
import { PawnTicketPaymentResponseDto } from '../../../dto/pawnTicketPayment/query/PawnTicketPaymentResponseDto';
import { toPawnTicketPaymentResponseDto } from '../../../mapping/pawnTicketPayment/pawnTicketPaymentMapper';

export class GetPawnTicketPaymentsUseCase {
  constructor(
    private readonly paymentRepository: PawnTicketPaymentRepository
  ) {}

  async execute(input: unknown): Promise<PawnTicketPaymentResponseDto[]> {
    const { pawnTicketId }: GetPawnTicketPaymentsRequestDto = 
      getPawnTicketPaymentsRequestSchema.parse(input);

    const payments = await this.paymentRepository.findByPawnTicketId(pawnTicketId);
    
    return payments.map(toPawnTicketPaymentResponseDto);
  }
}
