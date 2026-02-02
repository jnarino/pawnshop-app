import crypto from 'crypto';
import {
    createPawnTicketWithItemsRequestSchema,
    CreatePawnTicketWithItemsRequestDto,
} from '../../../dto/pawnTicket/command/CreatePawnTicketWithItemsRequestDto';
import { PawnTicketUnitOfWork } from '../../../common/PawnTicketUnitOfWork';
import { CreateInventoryItemOnPawnTicketUseCase } from '../../inventory/command/CreateInventoryItemOnPawnTicketUseCase';
import { CreatePawnTicketUseCase } from './CreatePawnTicketUseCase';
import { PawnTicketResponseDto } from '../../../dto/pawnTicket/query/PawnTicketResponseDto';
import { ItemAttributeMapper } from '../../../service/ItemAttributeMapper';
import { ControlNumberRepository } from '../../../../domains/controlNumber/ControlNumberRepository';
import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import { GunLog } from '../../../../domains/gun/GunLog';
import { GunTransactionHistory } from '../../../../domains/gun/GunTransactionHistory';
import { NotFoundError } from '../../../common/errors';

// EST is UTC-5
const getEstDate = () => {
    const now = new Date();
    return new Date(now.getTime() - (5 * 60 * 60 * 1000));
};

export class CreatePawnTicketWithItemsUseCase {
    constructor(
        private readonly pawnTicketUnitOfWork: PawnTicketUnitOfWork,
        private readonly attributeMapper: ItemAttributeMapper,
        private readonly controlNumberRepository: ControlNumberRepository,
        private readonly customerRepository: CustomerRepository
    ) { }

    async execute(input: unknown): Promise<PawnTicketResponseDto> {
        const parsed: CreatePawnTicketWithItemsRequestDto =
            createPawnTicketWithItemsRequestSchema.parse(input);

        const pawn = parsed.pawn;
        const items = parsed.items;

        // Fetch customer needed for GunLog
        const customer = await this.customerRepository.findById(pawn.customerId);
        if (!customer) {
            throw new NotFoundError('Customer not found');
        }

        // Everything below happens inside ONE DB transaction
        return this.pawnTicketUnitOfWork.runInTransaction(
            async ({ 
                inventoryItemRepository, 
                pawnTicketRepository, 
                dbClient,
                gunLogRepository,
                gunTransactionHistoryRepository
            }) => {
                // 1) Get the next control number using the repository
                const transactionType = pawn.transactionType || 'PAWN';
                let controlNumber: string;
                if (transactionType === 'PURCHASE') {
                    controlNumber = await this.controlNumberRepository.getNextPurchaseControlNumber(dbClient);
                } else {
                    controlNumber = await this.controlNumberRepository.getNextPawnControlNumber(dbClient);
                }

                // 2) Create inventory items with the control number
                const createInventoryItemOnPawnUseCase = new CreateInventoryItemOnPawnTicketUseCase(
                    inventoryItemRepository,
                    this.attributeMapper
                );
                const allItemIds: string[] = [];
                for (let i = 0; i < items.length; i++) {
                    const itemDto = items[i];
                    const itemIndex = i + 1;
                    const createdItem = await createInventoryItemOnPawnUseCase.execute(
                        itemDto,
                        controlNumber,
                        itemIndex,
                        transactionType
                    );
                    allItemIds.push(createdItem.id);

                    // --- GUN LOGIC START ---
                    if (createdItem.inventoryNumber && createdItem.inventoryNumber.startsWith('G-')) {
                        const attributes = (createdItem.attributes || {}) as any;
                        const clerkUserId = (pawn as any).clerkUserId;

                        // Create GunLog (Acquisition)
                        const gunLog = new GunLog({
                            id: crypto.randomUUID(),
                            inventoryItemId: createdItem.id,
                            manufacturer: attributes.manufacturer || 'Unknown',
                            model: createdItem.model || 'Unknown',
                            serial: createdItem.serialNumber || 'Unknown',
                            caliber: attributes.caliber || 'Unknown',
                            action: attributes.action || 'Unknown',
                            condition: createdItem.itemCondition || 'Unknown',
                            gunType: attributes.gunType || 'PISTOL', // Default or extract
                            importer: attributes.importer,
                            
                            buyerAmount: createdItem.priceAmount || 0,
                            buyerDate: getEstDate(),
                            buyerFirstName: customer.firstName,
                            buyerMiddleName: customer.middleName || undefined,
                            buyerLastName: customer.lastName,
                            buyerStreetAddress: customer.streetAddress || '',
                            buyerCity: customer.city || '',
                            buyerState: customer.stateUs || '',
                            buyerZipCode: customer.zipCode || '',
                            buyerIdType: customer.idType || 'ID',
                            buyerIdNumber: customer.idNumber || '',
                        });

                        await gunLogRepository.create(gunLog);

                        // Determine Transaction Type (PAWN or BUY)
                        const typeCode = transactionType === 'PURCHASE' ? 'BUY' : 'PAWN';
                        const typeId = await gunTransactionHistoryRepository.getTransactionTypeIdByCode(typeCode);

                        // Create GunTransactionHistory (Received)
                        const history = new GunTransactionHistory({
                            id: crypto.randomUUID(),
                            inventoryNumber: createdItem.inventoryNumber,
                            inventoryItemId: createdItem.id,
                            transactionDate: getEstDate(),
                            typeId: typeId || '00000000-0000-0000-0000-000000000000', // Fallback
                            clerkUserId: clerkUserId,
                            notes: transactionType === 'PURCHASE' ? 'Purchased from Customer' : 'Pawned from Customer'
                        });

                        await gunTransactionHistoryRepository.create(history);
                    }
                    // --- GUN LOGIC END ---
                }

                // 3) Create pawn ticket with the items
                const createPawnTicketUseCase = new CreatePawnTicketUseCase(
                    pawnTicketRepository
                );

                const amountFinanced = Number(pawn.amountFinanced) || 0;
                const tenders = [{
                    tenderTypeId: 1,
                    amount: -Math.abs(amountFinanced)
                }];

                const pawnInput = {
                    ...pawn,
                    itemIds: allItemIds,
                    tenders,
                    controlNumber // pass control number to repo
                };

                const pawnTicket = await createPawnTicketUseCase.execute(pawnInput);
                return pawnTicket;
            }
        );
    }
}
