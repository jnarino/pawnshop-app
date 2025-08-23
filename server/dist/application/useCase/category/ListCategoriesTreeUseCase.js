"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCategoriesTreeUseCase = void 0;
class ListCategoriesTreeUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute() {
        const rows = await this.repo.listFlat();
        const byId = new Map();
        const roots = [];
        for (const r of rows) {
            byId.set(r.id, { id: r.id, name: r.name, code: r.code, parentCode: null, children: [] });
        }
        for (const r of rows) {
            const n = byId.get(r.id);
            if (r.parent_id) {
                const p = byId.get(r.parent_id);
                if (p) {
                    n.parentCode = p.code;
                    p.children.push(n);
                }
                else {
                    roots.push(n);
                }
            }
            else {
                roots.push(n);
            }
        }
        return roots;
    }
}
exports.ListCategoriesTreeUseCase = ListCategoriesTreeUseCase;
