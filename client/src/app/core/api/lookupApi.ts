import { http } from './http';

export interface AttributeType {
  id: string;
  name: string;
  description: string | null;
}

export interface AttributeValue {
  id: string;
  value: string;
  description: string | null;
}

export async function getAttributeTypes(): Promise<AttributeType[]> {
  return http('/api/inventory/attributes/types');
}

export async function getAttributeValues(typeId: string): Promise<AttributeValue[]> {
  return http(`/api/inventory/attributes/values/${typeId}`);
}

export async function createAttributeType(payload: any) {
  return http(`/api/inventory/attributes/values`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createAttributeValue(payload: any) {
  return http(`/api/inventory/attributes/values`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

