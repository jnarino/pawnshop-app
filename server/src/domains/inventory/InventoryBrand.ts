export interface InventoryBrandProps {
    id: string;
    inventoryCategoryId: string;
    name: string;
    code: string;
    isActive?: boolean;
}

export class InventoryBrand {
    readonly id: string;
    readonly inventoryCategoryId: string;
    readonly name: string;
    readonly code: string;
    readonly isActive: boolean;

    constructor(props: InventoryBrandProps) {
        this.id = props.id;
        this.inventoryCategoryId = props.inventoryCategoryId;
        this.name = props.name;
        this.code = props.code;
        this.isActive = props.isActive ?? true;
    }
}
