import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

import { GetBrandsByCategoryRootUseCase } from '../../../../application/use-case/inventory/query/GetBrandsByCategoryRootUseCase';
import { GetRootCategoriesUseCase } from '../../../../application/use-case/inventory/query/GetRootCategoriesUseCase';
import { GetSubCategoriesUseCase } from '../../../../application/use-case/inventory/query/GetSubCategoriesUseCase';
export class InventoryCategoryController {
    constructor(

        private readonly getRootCategoriesUseCase: GetRootCategoriesUseCase,
        private readonly getSubCategoriesUseCase: GetSubCategoriesUseCase,
        private readonly getBrandsByCategoryRootUseCase: GetBrandsByCategoryRootUseCase

    ) { }

    /**
     * Get the tree structure of all categories.
     * GET /api/category/root     
     * @returns 
     */
    getRootCategories = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.getRootCategoriesUseCase.execute();
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Get the tree structure of sub-categories under a specific category
     * GET /api/category/:categoryId/subcategories    
     * @returns 
     */
    getSubCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const { categoryId } = req.params;
            const result = await this.getSubCategoriesUseCase.execute(categoryId);
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Get the brands by root category ID
     * GET /api/category/:categoryId/brands
     * @returns 
     */
    getBrandsByCategoryRoot = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const { categoryId } = req.params;
            const result = await this.getBrandsByCategoryRootUseCase.execute(categoryId);
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

}
