import { Request, Response } from 'express';
import { ListTenderTypes } from '../../../../application/use-case/tenderType/query/ListTenderTypes';

export class TenderTypeController {
    constructor(private listTenderTypes: ListTenderTypes) { }

    list = async (req: Request, res: Response) => {
        try {
            const types = await this.listTenderTypes.execute();
            res.json(types);
        } catch (error) {
            console.error('Error listing tender types:', error);
            res.status(500).json({ error: 'Failed to list tender types' });
        }
    };
}
