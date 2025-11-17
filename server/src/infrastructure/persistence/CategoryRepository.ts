import type { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export interface CategoryTreeItem {
    id: string;
    name: string;
    code: string;
    parent_id: string | null;
    path: string;
    depth?: number;
}

export class CategoryRepository {
    private readonly findAllCategoriesTreeSql: string;
    private readonly createCategorySql: string;

    constructor(private readonly pool: Pool) {
        if (!pool) {
            throw new Error('CategoryRepository requires a database pool');
        }
        
        // ✅ Load SQL from files
        const queryPath = path.join(__dirname, '../db/query/category');
        this.findAllCategoriesTreeSql = fs.readFileSync(
            path.join(queryPath, 'findAllCategoriesTree.sql'),
            'utf8'
        );
        this.createCategorySql = fs.readFileSync(
            path.join(queryPath, 'createCategory.sql'),
            'utf8'
        );
    }

    async getAllAsTree(): Promise<CategoryTreeItem[]> {
        try {
            console.log('[CategoryRepository] Fetching categories from database...');
            
            const result = await this.pool.query(this.findAllCategoriesTreeSql);
            
            console.log(`[CategoryRepository] Retrieved ${result.rows.length} categories`);
            return result.rows;
        } catch (error) {
            console.error('[CategoryRepository] Failed to get categories:', error);
            throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async create(category: { name: string; code: string; parent_id?: string | null }): Promise<{ id: string }> {
        try {
            console.log('[CategoryRepository] Creating category:', category);
            
            const result = await this.pool.query(this.createCategorySql, [
                category.name,
                category.code,
                category.parent_id || null
            ]);
            
            return { id: result.rows[0].id };
        } catch (error) {
            console.error('[CategoryRepository] Failed to create category:', error);
            throw new Error(`Failed to create category: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}