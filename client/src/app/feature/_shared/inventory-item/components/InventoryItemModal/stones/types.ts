export interface LookupTypeStones {
  id: string;
  name: string;
  attribute_type_id: string;
}

export interface Stone {
  id: string;
  quantity: string;
  type: LookupTypeStones;
  shape?: LookupTypeStones;
  carat?: string;
  color?: LookupTypeStones;
  weight?: string;
  length?: string;
  width?: string;
  clarity?: LookupTypeStones;
}
