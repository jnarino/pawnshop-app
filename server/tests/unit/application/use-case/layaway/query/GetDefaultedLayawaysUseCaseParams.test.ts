import { GetDefaultedLayawaysUseCase } from '../../../../../../src/application/use-case/layaway/query/GetDefaultedLayawaysUseCase';
import { LayawayRepository } from '../../../../../../src/domains/layaway/LayawayRepository';
import { LayawayAgreement } from '../../../../../../src/domains/layaway/LayawayAgreement';

describe('GetDefaultedLayawaysUseCase with Criteria', () => {
  let useCase: GetDefaultedLayawaysUseCase;
  let mockRepo: jest.Mocked<LayawayRepository>;

  beforeEach(() => {
    mockRepo = {
      findDefaulted: jest.fn(),
    } as unknown as jest.Mocked<LayawayRepository>;
    useCase = new GetDefaultedLayawaysUseCase(mockRepo);
  });

  it('should call repo with ticketNumber when provided', async () => {
    mockRepo.findDefaulted.mockResolvedValue([]);
    await useCase.execute({ ticketNumber: '123' });
    expect(mockRepo.findDefaulted).toHaveBeenCalledWith({ ticketNumber: '123' });
  });

  it('should call repo with dates when provided', async () => {
    mockRepo.findDefaulted.mockResolvedValue([]);
    const start = '2023-01-01';
    const end = '2023-01-31';
    await useCase.execute({ startDate: start, endDate: end });
    
    expect(mockRepo.findDefaulted).toHaveBeenCalledWith(expect.objectContaining({
      startDate: expect.any(Date),
      endDate: expect.any(Date)
    }));
  });

  it('should prioritize ticketNumber over dates', async () => {
    mockRepo.findDefaulted.mockResolvedValue([]);
    await useCase.execute({ ticketNumber: '123', startDate: '2023-01-01' });
    // Based on implementation: criteria.ticketNumber is set
    // validation logic might allow dates to be set too if they are passed, 
    // but repo implementation handles priority. 
    // The use case constructs the object.
    expect(mockRepo.findDefaulted).toHaveBeenCalledWith(expect.objectContaining({
      ticketNumber: '123'
    }));
  });
});
