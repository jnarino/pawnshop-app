import { CreateInventoryCategoryUseCase } from '../../../../../../src/application/use-case/inventory/command/CreateInventoryCategoryUseCase';
import { InventoryCategory } from '../../../../../../src/domains/inventory/InventoryCategory';
import { InventoryCategoryRepository } from '../../../../../../src/domains/inventory/InventoryCategoryRepository';

describe('CreateInventoryCategoryUseCase', () => {
    let useCase: CreateInventoryCategoryUseCase;
    let mockRepo: jest.Mocked<InventoryCategoryRepository>;

    beforeEach(() => {
        mockRepo = {
            create: jest.fn(),
            existsByCode: jest.fn(),
            getRootCategories: jest.fn(),
            getSubcategoriesGivenCategoryRoot: jest.fn(),
            getBrandsGivenCategoryRoot: jest.fn(),
            getCategoryBySubcategoryId: jest.fn(),
            existsSubCategoryByCode: jest.fn(),
            createSubCategory: jest.fn(),
        };
        useCase = new CreateInventoryCategoryUseCase(mockRepo);
    });

    it('should create category with unique code (3 chars) when no collision', async () => {
        mockRepo.existsByCode.mockResolvedValue(false); // No collision
        mockRepo.create.mockImplementation(async (c) => c);

        const input = { name: 'Electronics' };
        const result = await useCase.execute(input);

        expect(result.name).toBe('ELECTRONICS');
        expect(result.code).toBe('ELE');
        expect(mockRepo.create).toHaveBeenCalled();
    });

    it('should create category with suffix when collision occurs', async () => {
        // First call (ELE) returns true (exists), second call (ELE_1) returns false
        mockRepo.existsByCode
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(false);
        
        mockRepo.create.mockImplementation(async (c) => c);

        const input = { name: 'Electronics' };
        const result = await useCase.execute(input);

        expect(result.code).toBe('ELE_1');
        expect(mockRepo.existsByCode).toHaveBeenCalledTimes(2);
    });

    it('should handle short names', async () => {
        mockRepo.existsByCode.mockResolvedValue(false);
        mockRepo.create.mockImplementation(async (c) => c);

        const result = await useCase.execute({ name: 'TV' });
        expect(result.code).toBe('TVX');
    });
});
