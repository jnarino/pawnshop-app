import { CategoryRepository } from '../persistence/CategoryRepository';
import { CategoryCacheService } from '../cache/CategoryCacheService';
import { ListCategoriesTreeUseCase } from '../../application/useCase/category/ListCategoriesTreeUseCase';
import { makeCategoryController } from '../../controller/category/categoryControllerFactory';
import { pool } from '../db';
import type { DatabaseConnectionProvider } from '../providers/DatabaseConnectionProvider';

export class CategoryContainer {
    private readonly _repository: CategoryRepository;
    private readonly _cache: CategoryCacheService;
    private readonly _useCases: any;
    private readonly _controller: any;

    constructor(dbProvider: DatabaseConnectionProvider) {
        console.log('[CategoryContainer] Initializing category container...');
        
        try {
            // ✅ Step-by-step initialization with validation
            console.log('[CategoryContainer] Creating repository...');
            this._repository = new CategoryRepository(pool);
            
            console.log('[CategoryContainer] Creating cache service...');
            this._cache = new CategoryCacheService(this._repository);
            
            console.log('[CategoryContainer] Creating use cases...');
            const treeUseCase = new ListCategoriesTreeUseCase(this._cache);
            this._useCases = {
                tree: treeUseCase,
            };

            // ✅ Validate use case was created
            if (!this._useCases.tree || typeof this._useCases.tree.execute !== 'function') {
                throw new Error('Failed to create tree use case properly');
            }

            console.log('[CategoryContainer] Creating controller...');
            this._controller = makeCategoryController(this._useCases);

            // ✅ Validate controller was created with required methods
            if (!this._controller || typeof this._controller.tree !== 'function') {
                throw new Error('Failed to create category controller properly');
            }

            console.log('[CategoryContainer] Category container initialized successfully');
        } catch (error) {
            console.error('[CategoryContainer] Failed to initialize:', error);
            throw error;
        }
    }

    public getRepository() { return this._repository; }
    public getCache() { return this._cache; }
    public getUseCases() { return this._useCases; }
    public getController() { return this._controller; }

    public async shutdown(): Promise<void> {
        try {
            await this._cache.disconnect();
        } catch (error) {
            console.error('[CategoryContainer] Error during shutdown:', error);
        }
    }
}
