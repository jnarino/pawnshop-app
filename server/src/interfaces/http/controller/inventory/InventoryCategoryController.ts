import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

import { GetBrandsByCategoryRootUseCase } from '../../../../application/use-case/inventory/query/GetBrandsByCategoryRootUseCase';
import { GetRootCategoriesUseCase } from '../../../../application/use-case/inventory/query/GetRootCategoriesUseCase';
import { GetSubCategoriesUseCase } from '../../../../application/use-case/inventory/query/GetSubCategoriesUseCase';
import { CreateInventoryCategoryUseCase } from '../../../../application/use-case/inventory/command/CreateInventoryCategoryUseCase';
import { CreateInventorySubCategoryUseCase } from '../../../../application/use-case/inventory/command/CreateInventorySubCategoryUseCase';
import { CreateBrandUseCase } from '../../../../application/use-case/inventory/command/CreateBrandUseCase';

export class InventoryCategoryController {
    constructor(

        private readonly getRootCategoriesUseCase: GetRootCategoriesUseCase,
        private readonly getSubCategoriesUseCase: GetSubCategoriesUseCase,
        private readonly getBrandsByCategoryRootUseCase: GetBrandsByCategoryRootUseCase,
        private readonly createInventoryCategoryUseCase: CreateInventoryCategoryUseCase,
        private readonly createInventorySubCategoryUseCase: CreateInventorySubCategoryUseCase,
        private readonly createBrandUseCase: CreateBrandUseCase

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

    /**
     * Create a new category
     * POST /api/category
     */
    create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.createInventoryCategoryUseCase.execute(req.body);
            return res.status(201).json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Create a new subcategory
     * POST /api/category/subcategory
     */
    createSubCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.createInventorySubCategoryUseCase.execute(req.body);
            return res.status(201).json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Create a new brand
     * POST /api/category/brand
     */
    createBrand = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.createBrandUseCase.execute(req.body);
            return res.status(201).json(result);
        } catch (err) {
            return next(err);
        }
    };

}
