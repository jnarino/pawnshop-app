import { CategoryRepository } from '../../../infrastructure/persistence/CategoryRepository';

export interface CategoryNode {
    id: string;
    name: string;
    code: string;
    parentCode: string | null;
    children: CategoryNode[];
}

export class ListCategoriesTreeUseCase {
    constructor(private repo: CategoryRepository) { }

    async execute(): Promise<CategoryNode[]> {
        const rows = await this.repo.listFlat();
        const byId = new Map<string, CategoryNode>();
        const roots: CategoryNode[] = [];

        for (const r of rows) {
            byId.set(r.id, { id: r.id, name: r.name, code: r.code, parentCode: null, children: [] });
        }
        for (const r of rows) {
            const n = byId.get(r.id)!;
            if (r.parent_id) {
                const p = byId.get(r.parent_id);
                if (p) {
                    n.parentCode = p.code;
                    p.children.push(n);
                } else {
                    roots.push(n);
                }
            } else {
                roots.push(n);
            }
        }
        return roots;
    }
}