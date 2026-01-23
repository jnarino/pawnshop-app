import { GetLayawaysUseCase } from '../../../../../../src/application/use-case/layaway/query/GetLayawaysUseCase';
import { LayawayRepository } from '../../../../../../src/domains/layaway/LayawayRepository';
import { LayawayAgreement } from '../../../../../../src/domains/layaway/LayawayAgreement';

describe('GetLayawaysUseCase', () => {
  let useCase: GetLayawaysUseCase;
  let mockRepo: jest.Mocked<LayawayRepository>;

  beforeEach(() => {
    mockRepo = {
      findByCriteria: jest.fn(),
    };
    useCase = new GetLayawaysUseCase(mockRepo);
  });

  it('should return layaways when criteria match', async () => {
    const mockLayaway = {
      id: '123',
      ticketnum: 'L100',
      dateIn: new Date(),
      amount: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as LayawayAgreement;

    mockRepo.findByCriteria.mockResolvedValue([mockLayaway]);

    const result = await useCase.execute({ status: 'Active' });

    expect(result).toHaveLength(1);
    expect(result[0].ticketnum).toBe('L100');
    expect(mockRepo.findByCriteria).toHaveBeenCalledWith(expect.objectContaining({ status: 'Active' }));
  });

  it('should filter by date range', async () => {
    mockRepo.findByCriteria.mockResolvedValue([]);
    const startDate = '2023-01-01';
    const endDate = '2023-12-31';

    await useCase.execute({ startDate, endDate });

    expect(mockRepo.findByCriteria).toHaveBeenCalledWith(
        expect.objectContaining({
            startDate: expect.any(Date),
            endDate: expect.any(Date)
        })
    );
  });
});
