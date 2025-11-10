import type { Request, Response } from 'express';
import type { CreatePawnTicketPaymentUseCase } from '../../application/useCase/payment/CreatePawnTicketPaymentUseCase';

interface Dependencies {
  createPawnTicketPayment: CreatePawnTicketPaymentUseCase;
}

export function makePaymentController(deps: Dependencies) {
  
  const createPawnTicketPayment = async (req: Request, res: Response) => {
    try {
      const paymentData = req.body;
      console.log('[PaymentController] Creating pawn ticket payment:', paymentData);

      // Validate required fields
      if (!paymentData.customerId) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'customerId is required'
        });
      }

      if (!paymentData.totalAmount || paymentData.totalAmount <= 0) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'totalAmount must be greater than 0'
        });
      }

      if (!paymentData.pawnTicketPayments || paymentData.pawnTicketPayments.length === 0) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'At least one pawn ticket payment is required'
        });
      }

      if (!paymentData.tenders || paymentData.tenders.length === 0) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'At least one tender method is required'
        });
      }

      const result = await deps.createPawnTicketPayment.execute(paymentData);

      res.status(201).json({
        success: true,
        transactionId: result.transactionId,
        paymentId: result.paymentId,
        paymentIds: result.paymentIds,
        message: 'Payment processed successfully'
      });
    } catch (error) {
      console.error('[PaymentController] Payment creation failed:', error);
      res.status(500).json({
        error: 'payment_failed',
        message: error instanceof Error ? error.message : 'Payment processing failed'
      });
    }
  };

  return {
    createPawnTicketPayment,
  };
}
