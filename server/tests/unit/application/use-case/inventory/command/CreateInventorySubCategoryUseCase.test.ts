import { CreateInventorySubCategoryUseCase } from '../../../../../../src/application/use-case/inventory/command/CreateInventorySubCategoryUseCase';
import { InventoryCategoryRepository } from '../../../../../../src/domains/inventory/InventoryCategoryRepository';

describe('CreateInventorySubCategoryUseCase', () => {
    let useCase: CreateInventorySubCategoryUseCase;
    let mockRepo: jest.Mocked<InventoryCategoryRepository>;

    beforeEach(() => {
        mockRepo = {
            getRootCategories: jest.fn(),
            getSubcategoriesGivenCategoryRoot: jest.fn(),
            getBrandsGivenCategoryRoot: jest.fn(),
            getCategoryBySubcategoryId: jest.fn(),
            existsByCode: jest.fn(),
            create: jest.fn(),
            existsSubCategoryByCode: jest.fn(),
            createSubCategory: jest.fn(),
            existsBrandByCode: jest.fn(),
            createBrand: jest.fn()
        };
        useCase = new CreateInventorySubCategoryUseCase(mockRepo);
    });

    it('should create subcategory with generated code', async () => {
        mockRepo.existsSubCategoryByCode.mockResolvedValue(false);
        mockRepo.createSubCategory.mockImplementation(async (c) => c);

        const input = {
            inventoryCategoryId: '04b4fbe2-b00b-4b57-84c7-64d11ba10963',
            name: 'Bike Helmet'
        };

        const result = await useCase.execute(input);

        expect(result.name).toBe('BIKE HELMET');
        expect(result.code).toBe('BIK');
        expect(result.inventoryCategoryId).toBe(input.inventoryCategoryId);
        expect(mockRepo.existsSubCategoryByCode).toHaveBeenCalledWith('BIK');
        expect(mockRepo.createSubCategory).toHaveBeenCalled();
    });

    it('should handle code collision', async () => {
        mockRepo.existsSubCategoryByCode
            .mockResolvedValueOnce(true) // BIK exists
            .mockResolvedValueOnce(false); // BIK_2100 available

        mockRepo.createSubCategory.mockImplementation(async (c) => c);

        const input = {
            inventoryCategoryId: '04b4fbe2-b00b-4b57-84c7-64d11ba10963',
            name: 'Bike Lock'
        };

        const result = await useCase.execute(input);

        expect(result.name).toBe('BIKE LOCK');
        expect(result.code).toBe('BIK_2100');
        expect(mockRepo.createSubCategory).toHaveBeenCalled();
    });
});
