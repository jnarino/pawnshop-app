import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import { Actor } from '../../../common/Actor';
import { ForbiddenError } from '../../../common/errors';

export class DeleteCustomerUseCase {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(actor: Actor, id: string): Promise<void> {
    // Restrict delete to admin/manager
    if (actor.role !== 'admin' && actor.role !== 'manager') {
      throw new ForbiddenError('Not allowed to delete customers');
    }

    await this.customerRepo.delete(id);
  }
}
