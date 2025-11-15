import { PawnTicketRepository } from '../persistence/PawnTicketRepository';
import { CreatePawnTicketUseCase } from '../../application/useCase/pawnTicket/CreatePawnTicketUseCase';
import { GetPawnTicketUseCase } from '../../application/useCase/pawnTicket/GetPawnTicketUseCase';
import { UpdatePawnTicketDatesUseCase } from '../../application/useCase/pawnTicket/UpdatePawnTicketDatesUseCase';
import { DeletePawnTicketUseCase } from '../../application/useCase/pawnTicket/DeletePawnTicketUseCase';
import { SearchPawnTicketsUseCase } from '../../application/useCase/pawnTicket/SearchPawnTicketsUseCase';
import { FindAllPawnTicketsUseCase } from '../../application/useCase/pawnTicket/FindAllPawnTicketsUseCase';
import { makePawnTicketController } from '../../controller/pawnTicket/pawnTicketController';
import { RatePlanRepository } from '../persistence/RatePlanRepository';
import { StoreTransactionRepository } from '../persistence/StoreTransactionRepository';
import { GunlogRepository } from '../persistence/GunlogRepository';
import type { DatabaseConnectionProvider } from '../providers/DatabaseConnectionProvider';
import type { CustomerContainer } from './CustomerContainer';
import type { InventoryContainer } from './InventoryContainer';

// ✅ Single Responsibility: Manages pawn ticket domain dependencies
export class PawnTicketContainer {
    private readonly _repository: PawnTicketRepository;
    private readonly _ratePlanRepo: RatePlanRepository;
    private readonly _storeTransactionRepo: StoreTransactionRepository;
    private readonly _gunlogRepo: GunlogRepository;
    private readonly _useCases: any;
    private readonly _controller: any;

    constructor(
        dbProvider: DatabaseConnectionProvider,
        customerContainer: CustomerContainer,
        inventoryContainer: InventoryContainer
    ) {
        this._repository = new PawnTicketRepository();
        this._ratePlanRepo = new RatePlanRepository();
        this._storeTransactionRepo = new StoreTransactionRepository();
        this._gunlogRepo = new GunlogRepository();

        this._useCases = {
            findAll: new FindAllPawnTicketsUseCase(this._repository),
            create: new CreatePawnTicketUseCase(
                this._repository,
                customerContainer.getRepository(),
                this._ratePlanRepo,
                this._storeTransactionRepo,
                this._gunlogRepo,
                inventoryContainer.getUseCases().create
            ),
            get: new GetPawnTicketUseCase(this._repository),
            updateDates: new UpdatePawnTicketDatesUseCase(this._repository),
            delete: new DeletePawnTicketUseCase(this._repository),
            search: new SearchPawnTicketsUseCase(this._repository),
        };

        this._controller = makePawnTicketController(this._useCases);
    }

    public getRepository() { return this._repository; }
    public getUseCases() { return this._useCases; }
    public getController() { return this._controller; }
}
