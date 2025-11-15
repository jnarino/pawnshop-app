import { Request, Response, NextFunction } from 'express';
import type { ListCategoriesTreeUseCase } from '../../application/useCase/category/ListCategoriesTreeUseCase';
import { logger } from '../../infrastructure/log/logger';

// ✅ Async wrapper for controller methods
function wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

export function makeCategoryController(useCases: {
    tree: ListCategoriesTreeUseCase;
}) {
    // ✅ Validate use cases are provided
    if (!useCases || !useCases.tree) {
        throw new Error('CategoryController requires tree use case');
    }

    const tree = wrap(async (req: Request, res: Response) => {
        try {
            console.log('[CategoryController] Getting categories tree');
            logger.info('[CategoryController] Getting categories tree');
            
            const categories = await useCases.tree.execute();
            
            console.log(`[CategoryController] Retrieved ${categories.length} categories`);
            logger.info('[CategoryController] Categories retrieved successfully', { 
                count: categories.length,
                url: req.originalUrl 
            });
            
            // ✅ Add response headers to prevent browser caching issues
            res.set({
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            
            res.json(categories);
        } catch (error) {
            console.error('[CategoryController] Failed to get categories tree:', error);
            logger.error('[CategoryController] Failed to get categories tree:', { 
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                url: req.originalUrl
            });
            
            res.status(500).json({ 
                error: 'internal_error', 
                message: 'Failed to load categories',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    const controller = {
        tree
    };

    // ✅ Validate controller methods are functions
    if (typeof controller.tree !== 'function') {
        throw new Error('Category controller tree method is not a function');
    }

    logger.info('[CategoryController] Category controller created successfully');
    return controller;
}

export type CategoryController = ReturnType<typeof makeCategoryController>;