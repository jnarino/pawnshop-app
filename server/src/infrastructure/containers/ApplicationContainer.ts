import { CustomerContainer } from './CustomerContainer';
import { InventoryContainer } from './InventoryContainer';
import { PawnTicketContainer } from './PawnTicketContainer';
import { CategoryContainer } from './CategoryContainer';
import { PaymentContainer } from './PaymentContainer';
import { DatabaseConnectionProvider } from '../providers/DatabaseConnectionProvider';

// ✅ Single Responsibility: Main DI container orchestrating all domain containers
export class ApplicationContainer {
    private static instance: ApplicationContainer;
    private readonly _dbProvider: DatabaseConnectionProvider;
    private readonly _customerContainer: CustomerContainer;
    private readonly _inventoryContainer: InventoryContainer;
    private readonly _pawnTicketContainer: PawnTicketContainer;
    private readonly _categoryContainer: CategoryContainer;
    private readonly _paymentContainer: PaymentContainer;

    private constructor() {
        // ✅ Add initialization logging
        console.log('[ApplicationContainer] Initializing containers...');
        
        this._dbProvider = new DatabaseConnectionProvider();
        this._customerContainer = new CustomerContainer(this._dbProvider);
        this._inventoryContainer = new InventoryContainer(this._dbProvider);
        this._categoryContainer = new CategoryContainer(this._dbProvider);
        
        // ✅ Pawn ticket depends on customer and inventory (proper dependency order)
        this._pawnTicketContainer = new PawnTicketContainer(
            this._dbProvider,
            this._customerContainer,
            this._inventoryContainer
        );
        
        this._paymentContainer = new PaymentContainer(this._dbProvider);
        
        console.log('[ApplicationContainer] All containers initialized successfully');
    }

    public static getInstance(): ApplicationContainer {
        if (!ApplicationContainer.instance) {
            ApplicationContainer.instance = new ApplicationContainer();
        }
        return ApplicationContainer.instance;
    }

    // ✅ Interface Segregation: Each domain exposes only what's needed
    public get customer() { return this._customerContainer; }
    public get inventory() { return this._inventoryContainer; }
    public get pawnTicket() { return this._pawnTicketContainer; }
    public get category() { return this._categoryContainer; }
    public get payment() { return this._paymentContainer; }

    // ✅ Graceful shutdown
    public async shutdown(): Promise<void> {
        console.log('[ApplicationContainer] Shutting down gracefully...');
        
        try {
            // Shutdown category cache
            await this._categoryContainer.shutdown();
            
            // Shutdown database provider
            await this._dbProvider.shutdown();
            
            console.log('[ApplicationContainer] Shutdown completed successfully');
        } catch (error) {
            console.error('[ApplicationContainer] Error during shutdown:', error);
            throw error;
        }
    }
}
