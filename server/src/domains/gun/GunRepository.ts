import { GunLog } from './GunLog';
import { GunTransactionHistory } from './GunTransactionHistory';

export interface GunLogRepository {
    create(gunLog: GunLog): Promise<void>;
}

export interface GunTransactionHistoryRepository {
    create(history: GunTransactionHistory): Promise<void>;
}
