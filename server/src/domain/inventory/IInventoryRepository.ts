import { InventoryItem } from './InventoryItem';

export interface CreateInventoryItemDTO {
    inventoryNumber?: string; // externally assigned (e.g., controlNumber-seq)
    status?: InventoryItem['status'];
    categoryId: string; // required now (leaf category)
    brand?: string; model?: string; serialNumber?: string; color?: string; itemCondition?: string;
    quantity?: number; amount?: number; resale?: number; itemReplace?: number; binNumber?: string; ownerTag?: string; itemDescription?: string;
    attributes?: Record<string, any>; // merged flexible attributes
}

export interface UpdateInventoryItemDTO extends Partial<CreateInventoryItemDTO> {
    status?: InventoryItem['status'];
}

export interface IInventoryRepository {
    create(dto: CreateInventoryItemDTO): Promise<string>; // returns new id
    findById(id: string): Promise<InventoryItem | null>;
    findAll(limit?: number, offset?: number): Promise<InventoryItem[]>;
    update(id: string, dto: UpdateInventoryItemDTO): Promise<boolean>;
    delete(id: string): Promise<boolean>;
}
