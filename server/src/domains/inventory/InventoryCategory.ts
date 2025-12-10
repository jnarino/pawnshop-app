export class InventoryCategory {
  readonly id: string;

  name: string;
  code: string;
  parentId: string | null;
  path: string | null;
  depth: number;

  constructor(params: {
    id: string;
    name: string;
    code: string;
    parentId?: string | null;
    path?: string | null;
    depth: number;
  }) {
    this.id = params.id;

    this.name = params.name;
    this.code = params.code;
    this.parentId = params.parentId ?? null;
    this.path = params.path ?? null;
    this.depth = params.depth;
  }
}