import { CreateBrandUseCase } from '../../../../../../src/application/use-case/inventory/command/CreateBrandUseCase';
import { InventoryCategoryRepository } from '../../../../../../src/domains/inventory/InventoryCategoryRepository';
import { InventoryBrand } from '../../../../../../src/domains/inventory/InventoryBrand';

describe('CreateBrandUseCase', () => {
    let useCase: CreateBrandUseCase;
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
            createBrand: jest.fn(),
        };
        useCase = new CreateBrandUseCase(mockRepo);
    });

    it('should create brand with base code if it does not exist', async () => {
        const input = {
            inventoryCategoryId: 'd4c6cbcc-5d75-4605-b54a-f083bc08d22a',
            name: 'New Brand'
        };

        mockRepo.existsBrandByCode.mockResolvedValue(false);
        mockRepo.createBrand.mockImplementation(async (b) => b);

        const result = await useCase.execute(input);

        expect(result.name).toBe('NEW BRAND');
        expect(result.code).toBe('NEW');
        expect(mockRepo.createBrand).toHaveBeenCalledWith(expect.objectContaining({
            code: 'NEW'
        }));
    });

    it('should create brand with suffixed code if base code exists', async () => {
        const input = {
            inventoryCategoryId: 'd4c6cbcc-5d75-4605-b54a-f083bc08d22a',
            name: 'Existing'
        };

        // Mock existence: 'EXI' exists
        mockRepo.existsBrandByCode.mockImplementation(async (code) => {
            if (code === 'EXI') return true;
            return false;
        });
        mockRepo.createBrand.mockImplementation(async (b) => b);

        const result = await useCase.execute(input);

        expect(result.name).toBe('EXISTING');
        expect(result.code).toMatch(/^EXI_\d{4}$/); // Match EXI_####
        expect(mockRepo.createBrand).toHaveBeenCalled();
    });

    it('should handle short names', async () => {
        const input = {
            inventoryCategoryId: 'd4c6cbcc-5d75-4605-b54a-f083bc08d22a',
            name: 'A' // -> Should become AXX
        };

        mockRepo.existsBrandByCode.mockResolvedValue(false);
        mockRepo.createBrand.mockImplementation(async (b) => b);

        const result = await useCase.execute(input);

        expect(result.code).toBe('AXX');
    });
});
