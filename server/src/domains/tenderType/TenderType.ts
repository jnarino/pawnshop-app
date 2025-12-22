export class TenderType {
    constructor(
        public readonly id: number,
        public readonly name: string,
        public readonly legacyCode: string | null,
        public readonly active: boolean
    ) { }
}
