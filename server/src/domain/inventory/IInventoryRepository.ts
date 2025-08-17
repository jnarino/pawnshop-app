import { InventoryItem } from './InventoryItem';

export interface CreateInventoryItemDTO {
    inventoryNumber?: string; // externally assigned (e.g., controlNumber-seq)
    type: InventoryItem['type'];
    status?: InventoryItem['status'];
    categoryId?: string; subcategoryId?: string;
    brand?: string; model?: string; serialNumber?: string; color?: string; itemCondition?: string;
    quantity?: number; amount?: number; resale?: number; itemReplace?: number; bin?: string; ownerTag?: string; itemDescription?: string;
    firearm?: InventoryItem['firearm'];
    jewelry?: InventoryItem['jewelry'];
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
