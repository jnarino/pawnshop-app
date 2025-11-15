import { pool } from '../db';
import type { InventoryStatus } from '../../domain/inventory/InventoryStatus';

export interface IInventoryStatusRepository {
    findAll(): Promise<InventoryStatus[]>;
    create(status: Omit<InventoryStatus, 'sortOrder' | 'active'>): Promise<InventoryStatus>;
    deactivate(code: string): Promise<boolean>;
}

export class InventoryStatusRepository implements IInventoryStatusRepository {
    
    async findAll(): Promise<InventoryStatus[]> {
        try {
            const sql = `
                SELECT 
                    code,
                    description,
                    is_terminal as "isTerminal",
                    sort_order as "sortOrder",
                    active
                FROM inventory_status 
                WHERE active = true
                ORDER BY sort_order, code
            `;
            
            const result = await pool.query(sql);
            return result.rows;
        } catch (error) {
            console.error('[InventoryStatusRepository] Failed to get statuses:', error);
            throw new Error(`Failed to fetch inventory statuses: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async create(status: Omit<InventoryStatus, 'sortOrder' | 'active'>): Promise<InventoryStatus> {
        try {
            const sql = `
                INSERT INTO inventory_status (
                    code, 
                    description, 
                    is_terminal,
                    sort_order,
                    active
                ) VALUES ($1, $2, $3, 
                    COALESCE((SELECT MAX(sort_order) + 10 FROM inventory_status), 10),
                    true
                )
                RETURNING 
                    code,
                    description,
                    is_terminal as "isTerminal",
                    sort_order as "sortOrder",
                    active
            `;
            
            const result = await pool.query(sql, [
                status.code,
                status.description,
                status.isTerminal
            ]);
            
            return result.rows[0];
        } catch (error) {
            console.error('[InventoryStatusRepository] Failed to create status:', error);
            throw new Error(`Failed to create inventory status: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async deactivate(code: string): Promise<boolean> {
        try {
            const sql = `
                UPDATE inventory_status 
                SET active = false, updated_at = now()
                WHERE code = $1 AND active = true
            `;
            
            const result = await pool.query(sql, [code]);
            return result.rowCount === 1;
        } catch (error) {
            console.error('[InventoryStatusRepository] Failed to deactivate status:', error);
            throw new Error(`Failed to deactivate inventory status: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
