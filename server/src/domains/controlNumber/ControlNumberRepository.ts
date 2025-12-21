export interface ControlNumberRepository {
    getNextPawnControlNumber(db: any): Promise<string>;
    getNextPurchaseControlNumber(db: any): Promise<string>;
}
