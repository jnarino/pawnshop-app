import { GetActivePawnsUseCase } from '../../../../../../../src/application/use-case/reports/pawn/query/GetActivePawnsUseCase';
import { ActivePawnReportRepository } from '../../../../../../../src/domains/reports/pawn/ActivePawnReportRepository';
import { NotFoundError } from '../../../../../../../src/application/common/errors';
import { ActivePawnRecord } from '../../../../../../../src/domains/reports/pawn/ActivePawnRecord';
import { GetPawnTicketCurrentChargesUseCase } from '../../../../../../../src/application/use-case/pawnTicket/query/GetPawnTicketCurrentChargesUseCase';

describe('GetActivePawnsUseCase', () => {
  let repo: jest.Mocked<ActivePawnReportRepository>;
  let chargesUseCase: jest.Mocked<GetPawnTicketCurrentChargesUseCase>;
  let useCase: GetActivePawnsUseCase;

  beforeEach(() => {
    repo = {
      findActive: jest.fn(),
    } as any;
    chargesUseCase = {
      execute: jest.fn(),
    } as any;
    useCase = new GetActivePawnsUseCase(repo, chargesUseCase);
  });

  const sampleRecord = new ActivePawnRecord({
    pawnTicketId: 'pt-1',
    ticketNumber: '123',
    customerName: 'John Doe',
    employeeUsername: 'employee',
    dateIn: new Date('2026-02-01T10:00:00Z'),
    dateOut: new Date('2026-03-01T10:00:00Z'),
    serviceChargeDue: 50,
    itemAmount: 200,
    quantity: 1,
    itemDescription: 'Ring',
    status: 'P',
    brand: 'BrandX',
    model: 'ModelY',
    serialNumber: 'SN123',
    extra: { karat: '14k' },
    attributes: { weight: '6.8g' },
  });

  it('returns rows with totals and current charges when records exist', async () => {
    repo.findActive.mockResolvedValue([sampleRecord]);
    chargesUseCase.execute.mockResolvedValue({ pawnTicketId: 'pt-1', currentCharges: 12, pawnAmount: 200, periodsBehind: 0, redemptionAmount: 0 });

    const result = await useCase.execute({});

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      pawnTicketId: 'pt-1',
      ticketNumber: '123',
      customer: 'John Doe',
      employee: 'employee',
      // pawn amount = amount_financed, service charges due = current charges
      serviceChargeDue: 12,
      currentCharges: 12,
      pawnAmount: 50,
      itemAmount: 200,
      itemsCount: 1,
      status: 'P',
      items: [
        {
          description: 'Ring',
          amount: 200,
          quantity: 1,
          brand: 'BrandX',
          model: 'ModelY',
          serialNumber: 'SN123',
          extra: { karat: '14k' },
          attributes: { weight: '6.8g' },
        },
      ],
    });
    expect(result.totals).toMatchObject({
      totalPawns: 1,
      totalItems: 1,
      totalPawnAmount: 50,
      totalServiceChargesDue: 12,
      totalPoliceHoldAmount: 0,
    });
    expect(repo.findActive).toHaveBeenCalledWith({ categoryId: undefined, subcategoryId: undefined, excludeJewelryAndFirearm: false });
    expect(chargesUseCase.execute).toHaveBeenCalledWith({ controlNumber: '123' });
  });

  it('passes filters to repository', async () => {
    repo.findActive.mockResolvedValue([sampleRecord]);
    chargesUseCase.execute.mockResolvedValue({ pawnTicketId: 'pt-1', currentCharges: 12, pawnAmount: 200, periodsBehind: 0, redemptionAmount: 0 });
    const categoryId = '11111111-1111-1111-1111-111111111111';
    const subcategoryId = '22222222-2222-2222-2222-222222222222';

    await useCase.execute({ categoryId, subcategoryId });

    expect(repo.findActive).toHaveBeenCalledWith({ categoryId, subcategoryId, excludeJewelryAndFirearm: false });
  });

  it('throws NotFoundError when no records', async () => {
    repo.findActive.mockResolvedValue([]);
    chargesUseCase.execute.mockResolvedValue({ pawnTicketId: 'pt-1', currentCharges: 12, pawnAmount: 200, periodsBehind: 0, redemptionAmount: 0 });

    await expect(useCase.execute({})).rejects.toThrow(NotFoundError);
  });

  it('counts items by rows, not quantity', async () => {
    const recordWithQuantityThree = new ActivePawnRecord({
      ...sampleRecord,
      quantity: 3,
      itemAmount: 150,
      itemDescription: 'Necklace',
    });
    const secondRecordSameTicket = new ActivePawnRecord({
      ...sampleRecord,
      quantity: 5,
      itemAmount: 250,
      itemDescription: 'Bracelet',
    });

    repo.findActive.mockResolvedValue([recordWithQuantityThree, secondRecordSameTicket]);
    chargesUseCase.execute.mockResolvedValue({ pawnTicketId: 'pt-1', currentCharges: 25, pawnAmount: 400, periodsBehind: 0, redemptionAmount: 0 });

    const result = await useCase.execute({});

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      itemsCount: 2,
      quantity: 8,
      itemAmount: 400,
      serviceChargeDue: 25,
      pawnAmount: 50,
    });
    expect(result.totals.totalItems).toBe(2);
    expect(result.totals.totalPawns).toBe(1);
    expect(result.totals.totalPawnAmount).toBe(50);
    expect(result.totals.totalServiceChargesDue).toBe(25);
  });

  it('sums service charges once per ticket', async () => {
    const firstItem = new ActivePawnRecord({
      ...sampleRecord,
      itemAmount: 100,
      itemDescription: 'Watch',
    });
    const secondItemSameTicket = new ActivePawnRecord({
      ...sampleRecord,
      itemAmount: 80,
      itemDescription: 'Chain',
    });

    repo.findActive.mockResolvedValue([firstItem, secondItemSameTicket]);
    chargesUseCase.execute.mockResolvedValue({ pawnTicketId: 'pt-1', currentCharges: 15, pawnAmount: 180, periodsBehind: 0, redemptionAmount: 0 });

    const result = await useCase.execute({});

    expect(result.totals.totalServiceChargesDue).toBe(15);
    expect(chargesUseCase.execute).toHaveBeenCalledTimes(1);
    expect(chargesUseCase.execute).toHaveBeenCalledWith({ controlNumber: '123' });
  });

  it('passes exclusion flag to repository', async () => {
    repo.findActive.mockResolvedValue([sampleRecord]);
    chargesUseCase.execute.mockResolvedValue({ pawnTicketId: 'pt-1', currentCharges: 12, pawnAmount: 200, periodsBehind: 0, redemptionAmount: 0 });

    await useCase.execute({ excludeJewelryAndFirearm: true });

    expect(repo.findActive).toHaveBeenCalledWith({ categoryId: undefined, subcategoryId: undefined, excludeJewelryAndFirearm: true });
  });
});
