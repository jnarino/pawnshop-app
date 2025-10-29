import { useInventoryCategories } from '@/app/shared/hooks/useInventoryCategories';

export function useCategoryLookup() {
  const { tree, loading } = useInventoryCategories();

  const getCategoryIdByPath = (typeCode: string, subCode?: string, brandCode?: string): string | null => {
    // Find type (top level) - e.g., "JEWELRY"
    const typeNode = tree.find(n => n.code === typeCode);
    if (!typeNode) return null;
    
    if (!subCode) return typeNode.id;
    
    // Find subcategory - e.g., "NECKLACE"
    const subNode = typeNode.children.find(c => c.code === subCode);
    if (!subNode) return typeNode.id;
    
    if (!brandCode) return subNode.id;
    
    // Find brand/leaf - e.g., "CARTIER"
    const brandNode = subNode.children.find(c => c.code === brandCode);
    return brandNode ? brandNode.id : subNode.id;
  };

  return { getCategoryIdByPath, loading };
}
