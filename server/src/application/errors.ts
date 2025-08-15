// Central application error types with uniform shape
export class AppError extends Error {
  constructor(public code: string, public httpStatus: number, message: string, public details?: any) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) { super('VALIDATION_ERROR', 400, message, details); this.name = 'ValidationError'; }
}

export class NotFoundError extends AppError {
  constructor(message: string) { super('NOT_FOUND', 404, message); this.name = 'NotFoundError'; }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal Error') { super('INTERNAL_ERROR', 500, message); this.name = 'InternalError'; }
}
