import { TenderTypeRepository } from '../../../../domains/tenderType/TenderTypeRepository';
import { TenderType } from '../../../../domains/tenderType/TenderType';

export class ListTenderTypes {
    constructor(private tenderTypeRepository: TenderTypeRepository) { }

    async execute(): Promise<TenderType[]> {
        return this.tenderTypeRepository.findAllActive();
    }
}
