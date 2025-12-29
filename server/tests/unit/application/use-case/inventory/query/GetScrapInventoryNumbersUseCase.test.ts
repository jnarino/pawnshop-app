import { GetScrapInventoryNumbersUseCase } from '../../../../../../src/application/use-case/inventory/query/GetScrapInventoryNumbersUseCase';

describe('GetScrapInventoryNumbersUseCase', () => {
  it('returns scrap inventory numbers and descriptions from hardcoded list', async () => {
    const mockRepository = {
      findByInventoryNumbers: jest.fn().mockResolvedValue([
        {
          inventoryNumber: 'I-183',
          itemDescription: '10 KT SCRAP'
        },
        {
          inventoryNumber: '3441-1',
          itemDescription: '14 KT SCRAP'
        },
        {
          inventoryNumber: 'I-195',
          itemDescription: '18kt scrap gold'
        },
        {
          inventoryNumber: 'I-256',
          itemDescription: '22K'
        },
        {
          inventoryNumber: 'I-11243',
          itemDescription: '24" CUBAN LINK CHAIN'
        },
        {
          inventoryNumber: 'I-755',
          itemDescription: 'ALL MISC KNIFES'
        },
        {
          inventoryNumber: 'I-212',
          itemDescription: 'COMPACT DISC INVENTORY'
        },
        {
          inventoryNumber: 'I-518',
          itemDescription: 'DVD MOVIE'
        },
        {
          inventoryNumber: 'I-511',
          itemDescription: 'GOLD BRACELETS  SOLD BY THE GRAM'
        },
        {
          inventoryNumber: 'I-526',
          itemDescription: 'LOOSE COLORED STONES'
        },
        {
          inventoryNumber: 'I-185',
          itemDescription: 'LOSE DIAMONDS'
        },
        {
          inventoryNumber: 'I-525',
          itemDescription: 'MISC COLLECTERS PLATES'
        },
        {
          inventoryNumber: 'I-512',
          itemDescription: 'NEW 14KT EARRINGS/CHARMS SOLD BY GRAM'
        },
        {
          inventoryNumber: 'I-524',
          itemDescription: 'PLAT. SCRAP'
        },
        {
          inventoryNumber: 'I-224',
          itemDescription: 'SILVER'
        },
        {
          inventoryNumber: 'I-251',
          itemDescription: 'TOOLS AND MISC.'
        },
        {
          inventoryNumber: 'I-522',
          itemDescription: 'US COINS'
        },
        {
          inventoryNumber: 'I-239',
          itemDescription: 'VHS TAPES INVENTORY'
        },
        {
          inventoryNumber: 'I-315',
          itemDescription: 'VIDEO GAMES'
        },
        {
          inventoryNumber: 'I-776',
          itemDescription: 'VIDEO GAMES'
        }
      ])
    } as any;

    const useCase = new GetScrapInventoryNumbersUseCase(mockRepository);

    const result = await useCase.execute();

    expect(result).toHaveLength(20);
    expect(result[0]).toEqual({
      inventoryNumber: 'I-183',
      itemDescription: '10 KT SCRAP'
    });
    expect(result[4]).toEqual({
      inventoryNumber: 'I-11243',
      itemDescription: '24" CUBAN LINK CHAIN'
    });
    expect(result[19]).toEqual({
      inventoryNumber: 'I-776',
      itemDescription: 'VIDEO GAMES'
    });

    expect(mockRepository.findByInventoryNumbers).toHaveBeenCalledWith([]);
  });

  it('returns empty array when query returns no results', async () => {
    const mockRepository = {
      findByInventoryNumbers: jest.fn().mockResolvedValue([])
    } as any;

    const useCase = new GetScrapInventoryNumbersUseCase(mockRepository);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
