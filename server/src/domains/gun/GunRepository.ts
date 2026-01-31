import { GunLog } from './GunLog';
import { GunTransactionHistory } from './GunTransactionHistory';

export interface GunLogRepository {
    create(gunLog: GunLog): Promise<void>;
    update(gunLog: GunLog): Promise<void>;
    findByInventoryItemId(inventoryItemId: string): Promise<GunLog | null>;
    getNextGunTransferNumber(): Promise<string>;
}

export interface GunTransactionHistoryRepository {
    create(history: GunTransactionHistory): Promise<void>;
}
