import { InventoryItem } from './InventoryItem';
import type { PoolClient } from 'pg';

export interface CreateInventoryItemDTO {
    inventoryNumber?: string; // externally assigned (e.g., controlNumber-seq)
    status?: InventoryItem['status'];
    categoryId: string; // required now (leaf category)
    brand?: string; model?: string; serialNumber?: string; 
    colorId?: string | null; // ✅ Allow null
    itemCondition?: string;
    quantity?: number; priceAmount?: number; resale?: number; minResale?: number; itemReplace?: number; binNumber?: string; ownerMark?: string; itemDescription?: string;
    attributes?: Record<string, any>; // merged flexible attributes
}

export interface UpdateInventoryItemDTO extends Partial<CreateInventoryItemDTO> {
    status?: string;
    categoryId?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    colorId?: string | null; // ✅ Allow null
    itemCondition?: string;
    quantity?: number;
    priceAmount?: number;
    resale?: number;
    minResale?: number;
    itemReplace?: number;
    ownerMark?: string;
    itemDescription?: string;
    attributes?: Record<string, any>;
}

export interface IInventoryRepository {
    createSingleItem(dto: CreateInventoryItemDTO): Promise<string>; // ✅ Renamed from create
    createInTransaction(client: PoolClient, dto: CreateInventoryItemDTO): Promise<string>; // ✅ Renamed from createWithClient
    findById(id: string): Promise<InventoryItem | null>;
    findByIdInTransaction?(client: PoolClient, id: string): Promise<InventoryItem | null>; // ✅ Optional method
    findAll(limit?: number, offset?: number): Promise<InventoryItem[]>;
    update(id: string, dto: UpdateInventoryItemDTO): Promise<boolean>;
    delete(id: string): Promise<boolean>;
}
