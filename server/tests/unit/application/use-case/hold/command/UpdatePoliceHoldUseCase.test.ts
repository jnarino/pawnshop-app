import { UpdatePoliceHoldUseCase } from '../../../../../../src/application/use-case/hold/command/UpdatePoliceHoldUseCase';
import { HoldUnitOfWork } from '../../../../../../src/application/common/HoldUnitOfWork';
import { HoldItem } from '../../../../../../src/domains/hold/HoldItem';
import { NotFoundError } from '../../../../../../src/application/common/errors';

describe('UpdatePoliceHoldUseCase', () => {
  let useCase: UpdatePoliceHoldUseCase;
  let mockUow: jest.Mocked<HoldUnitOfWork>;
  let mockHoldRepo: any;
  let mockInventoryRepo: any;

  beforeEach(() => {
    mockHoldRepo = {
      findById: jest.fn(),
      update: jest.fn()
    };
    mockInventoryRepo = {
      updateStatus: jest.fn()
    };

    mockUow = {
      runInTransaction: jest.fn().mockImplementation(async (callback) => {
        return callback({
          holdRepository: mockHoldRepo,
          inventoryItemRepository: mockInventoryRepo,
          controlNumberRepository: {} as any
        });
      })
    } as any;

    useCase = new UpdatePoliceHoldUseCase(mockUow);
  });

  it('should update a police hold and return response', async () => {
    const existing = new HoldItem({
      id: '11111111-1111-1111-1111-111111111111',
      controlNumber: '1000',
      holdDate: new Date('2023-01-01T00:00:00.000Z'),
      agency: 'Police',
      caseNumber: 'CASE-123',
      dateOut: null,
      isHold: true,
      isInventory: false,
      comment: 'Stolen',
      agentLastName: 'Smith',
      agentFirstName: 'Agent',
      agentMiddleInitial: 'A',
      badgeNumber: '1234',
      phoneAreaCode: '555',
      phoneNumber: '123-4567',
      phoneExtension: '101',
      jurisdiction: 'City',
      legacyHcnId: null,
      clerkUsername: 'clerk1',
      updatedBy: 'updater1',
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-01T00:00:00.000Z'),
      items: []
    });

    const updated = new HoldItem({
      ...existing,
      agency: 'Updated Agency',
      caseNumber: 'CASE-456',
      comment: 'Updated',
      updatedAt: new Date('2023-02-01T00:00:00.000Z')
    });

    mockHoldRepo.findById.mockResolvedValue(existing);
    mockHoldRepo.update.mockResolvedValue(updated);

    const result = await useCase.execute({
      id: '11111111-1111-1111-1111-111111111111',
      holdDate: '2023-02-01T00:00:00.000Z',
      caseNumber: 'CASE-456',
      agency: 'Updated Agency',
      jurisdiction: 'Updated City',
      agentFirstName: 'Agent',
      agentMiddleInitial: 'B',
      agentLastName: 'Smith',
      badgeNumber: '9999',
      phoneAreaCode: '555',
      phoneNumber: '111-2222',
      phoneExtension: '202',
      isHold: true,
      comment: 'Updated',
      itemIds: ['22222222-2222-2222-2222-222222222222']
    });

    expect(mockHoldRepo.findById).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
    expect(mockHoldRepo.update).toHaveBeenCalled();
    expect(mockInventoryRepo.updateStatus).toHaveBeenCalledWith('22222222-2222-2222-2222-222222222222', 'H');
    expect(result.controlNumber).toBe('1000');
    expect(result.caseNumber).toBe('CASE-456');
  });

  it('should throw NotFoundError when hold is missing', async () => {
    mockHoldRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({
      id: '33333333-3333-3333-3333-333333333333',
      holdDate: '2023-02-01T00:00:00.000Z',
      caseNumber: 'CASE-456',
      agency: 'Updated Agency',
      jurisdiction: 'Updated City',
      isHold: true,
      comment: 'Updated',
      itemIds: ['22222222-2222-2222-2222-222222222222']
    })).rejects.toThrow(NotFoundError);
  });
});
