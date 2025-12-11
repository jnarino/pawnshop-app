import { InventoryGenericColor } from '../../../domains/inventory/InventoryColor';
import { InventoryGenericColorResponseDto } from '../../dto/inventory/query/InventoryColorResponseDto';

export function toInventoryColorResponseDto(color: InventoryGenericColor): InventoryGenericColorResponseDto {
    return {
        id: color.id,
        value: color.value
    };
}
