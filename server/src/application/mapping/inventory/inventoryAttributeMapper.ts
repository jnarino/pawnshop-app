import { InventoryAttributeType } from '../../../domains/inventory/InventoryAttributeType';
import { InventoryAttributeValue } from '../../../domains/inventory/InventoryAttributeValue';
import { InventoryAttributeTypeResponseDto } from '../../dto/inventory/query/InventoryAttributeTypeResponseDto';
import { InventoryAttributeValueResponseDto } from '../../dto/inventory/query/InventoryAttributeValueResponseDto';

export function toInventoryAttributeTypeResponseDto(
  type: InventoryAttributeType
): InventoryAttributeTypeResponseDto {
  return {
    id: type.id,
    name: type.name
  };
}

export function toInventoryAttributeValueResponseDto(
  value: InventoryAttributeValue
): InventoryAttributeValueResponseDto {
  return {
    id: value.id,
    attributeTypeId: value.attributeTypeId,
    value: value.value
  };
}
