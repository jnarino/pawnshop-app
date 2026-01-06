import { Request, Response } from 'express';
import { ListTenderTypesUseCase } from '../../../../application/use-case/tenderType/query/ListTenderTypesUseCase';

export class TenderTypeController {
    constructor(private listTenderTypesUseCase: ListTenderTypesUseCase) { }

    list = async (req: Request, res: Response) => {
        try {
            const types = await this.listTenderTypesUseCase.execute();
            res.json(types);
        } catch (error) {
            console.error('Error listing tender types:', error);
            res.status(500).json({ error: 'Failed to list tender types' });
        }
    };
}
