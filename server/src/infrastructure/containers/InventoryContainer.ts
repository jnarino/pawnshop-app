import { InventoryRepository } from '../persistence/InventoryRepository';
import { InventoryStatusRepository } from '../persistence/InventoryStatusRepository';
import { CreateInventoryItemUseCase } from '../../application/useCase/inventory/CreateInventoryItemUseCase';
import { DeleteInventoryItemUseCase } from '../../application/useCase/inventory/DeleteInventoryItemUseCase';
import { GetInventoryItemUseCase } from '../../application/useCase/inventory/GetInventoryItemUseCase';
import { ListInventoryItemsUseCase } from '../../application/useCase/inventory/ListInventoryItemsUseCase';
import { UpdateInventoryItemUseCase } from '../../application/useCase/inventory/UpdateInventoryItemUseCase';
import { ListInventoryStatusesUseCase } from '../../application/useCase/inventory/status/ListInventoryStatusesUseCase';
import { CreateInventoryStatusUseCase } from '../../application/useCase/inventory/status/CreateInventoryStatusUseCase';
import { DeactivateInventoryStatusUseCase } from '../../application/useCase/inventory/status/DeactivateInventoryStatusUseCase';
import { makeInventoryController } from '../../controller/inventory/inventoryControllerFactory';
import { makeInventoryStatusController } from '../../controller/inventory/inventoryStatusControllerFactory';
import type { DatabaseConnectionProvider } from '../providers/DatabaseConnectionProvider';

// ✅ Single Responsibility: Manages inventory domain dependencies
export class InventoryContainer {
    private readonly _repository: InventoryRepository;
    private readonly _statusRepository: InventoryStatusRepository;
    private readonly _useCases: any;
    private readonly _statusUseCases: any;
    private readonly _controller: any;
    private readonly _statusController: any;

    constructor(dbProvider: DatabaseConnectionProvider) {
        console.log('[InventoryContainer] Initializing inventory container...');
        
        try {
            console.log('[InventoryContainer] Creating repositories...');
            this._repository = new InventoryRepository(dbProvider.getPool());
            this._statusRepository = new InventoryStatusRepository();
            
            console.log('[InventoryContainer] Creating use cases...');
            this._useCases = {
                list: new ListInventoryItemsUseCase(this._repository),
                get: new GetInventoryItemUseCase(this._repository),
                create: new CreateInventoryItemUseCase(this._repository),
                update: new UpdateInventoryItemUseCase(this._repository),
                delete: new DeleteInventoryItemUseCase(this._repository),
            };

            this._statusUseCases = {
                list: new ListInventoryStatusesUseCase(this._statusRepository),
                create: new CreateInventoryStatusUseCase(this._statusRepository),
                deactivate: new DeactivateInventoryStatusUseCase(this._statusRepository),
            };

            console.log('[InventoryContainer] Creating controllers...');
            this._controller = makeInventoryController(this._useCases);
            this._statusController = makeInventoryStatusController(this._statusUseCases);

            // ✅ Validate controllers were created properly
            if (!this._controller || typeof this._controller.list !== 'function') {
                throw new Error('Failed to create inventory controller properly');
            }
            
            if (!this._statusController || typeof this._statusController.list !== 'function') {
                throw new Error('Failed to create inventory status controller properly');
            }

            console.log('[InventoryContainer] Inventory container initialized successfully');
        } catch (error) {
            console.error('[InventoryContainer] Failed to initialize:', error);
            throw error;
        }
    }

    public getRepository() { return this._repository; }
    public getUseCases() { return this._useCases; }
    public getController() { return this._controller; }
    public getStatusController() { return this._statusController; }
}
