import { http } from './http';

export interface CategoryOption {
  id: string;
  name: string;
}

export async function getRootCategories(): Promise<CategoryOption[]> {
  return http('/api/category/root');
}

export async function getSubcategories(categoryId: string): Promise<CategoryOption[]> {
  return http(`/api/category/${categoryId}/subcategories`);
}

export async function getBrands(categoryId: string): Promise<CategoryOption[]> {
  return http(`/api/category/${categoryId}/brands`);
}

export async function createNewSubcategory(payload: any) {
  return http(`/api/category/subcategory`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createNewBrand(payload: any) {
  return http(`/api/category/brand`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
