export interface InventoryCategoryTreeItemResponseDto {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  path: string | null;
  depth: number;
}
