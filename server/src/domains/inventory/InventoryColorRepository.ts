import { InventoryGenericColor } from './InventoryColor';

export interface InventoryColorRepository {
    /**
     * Get all available colors
     */
    findAllGenericColors(): Promise<InventoryGenericColor[]>;
}
