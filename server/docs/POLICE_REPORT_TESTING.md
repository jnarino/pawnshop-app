# Police Report Service - Testing Guide

## Testing Strategy

The Police Report Service follows a layered testing approach:
1. **Unit Tests** - Test use cases with mocked repositories
2. **Integration Tests** - Test with real database
3. **API Tests** - Test HTTP endpoints with cURL or Postman
4. **PDF Validation** - Verify PDF generation and content

## Unit Testing Use Cases

### Setup Mock Repository

```typescript
import { PoliceReportRepository } from '../src/domains/reports/police/PoliceReportRepository';
import { GetPoliceReportsUseCase } from '../src/application/use-case/reports/police/query/GetPoliceReportsUseCase';

// Mock repository
const mockRepo: jest.Mocked<PoliceReportRepository> = {
  findByCriteria: jest.fn(),
  findActiveHolds: jest.fn(),
  findByControlNumber: jest.fn(),
  findByAgency: jest.fn(),
  create: jest.fn(),
  countHolds: jest.fn()
};

const useCase = new GetPoliceReportsUseCase(mockRepo);
```

### Test GetPoliceReportsUseCase

```typescript
describe('GetPoliceReportsUseCase', () => {
  it('should return reports filtered by date range', async () => {
    // Arrange
    const mockReport = new PoliceReport({
      id: 'test-id',
      controlNumber: '117376',
      storeName: 'TEST STORE',
      // ... other required fields
    });
    
    mockRepo.findByCriteria.mockResolvedValue([mockReport]);

    // Act
    const result = await useCase.execute({
      startDate: '2025-10-01T00:00:00Z',
      endDate: '2025-10-31T23:59:59Z',
      limit: 100,
      offset: 0
    });

    // Assert
    expect(result.totalCount).toBe(1);
    expect(result.reports).toHaveLength(1);
    expect(result.reports[0].controlNumber).toBe('117376');
    expect(mockRepo.findByCriteria).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: new Date('2025-10-01T00:00:00Z'),
        endDate: new Date('2025-10-31T23:59:59Z'),
        limit: 100,
        offset: 0
      })
    );
  });

  it('should throw ValidationError on invalid date format', async () => {
    // Act & Assert
    await expect(
      useCase.execute({
        startDate: 'invalid-date',
        endDate: '2025-10-31'
      })
    ).rejects.toThrow();
  });
});
```

### Test GetActivePoliceHoldsUseCase

```typescript
describe('GetActivePoliceHoldsUseCase', () => {
  it('should return only active holds', async () => {
    // Arrange
    const mockReports = [
      createMockReport('117376', null), // Active
      createMockReport('117377', null), // Active
      createMockReport('117378', new Date('2025-11-15')) // Released
    ];
    
    // Only first two are active
    mockRepo.findActiveHolds.mockResolvedValue(
      mockReports.filter(r => r.holdDateOut === null)
    );

    // Act
    const result = await useCase.execute({ limit: 100, offset: 0 });

    // Assert
    expect(result.reports).toHaveLength(2);
    expect(result.reports[0].holdStatus).toBe('ACTIVE');
    expect(result.reports[1].holdStatus).toBe('ACTIVE');
  });

  it('should apply pagination correctly', async () => {
    // Arrange
    const mockReports = Array.from({ length: 250 }, (_, i) =>
      createMockReport(`${i + 1}`, null)
    );
    
    mockRepo.findActiveHolds.mockResolvedValue(mockReports);

    // Act
    const result = await useCase.execute({ limit: 100, offset: 50 });

    // Assert - Note: pagination is done in use case, not repository
    expect(result.reports.length).toBeLessThanOrEqual(100);
  });
});
```

### Test GeneratePoliceReportUseCase

```typescript
describe('GeneratePoliceReportUseCase', () => {
  it('should generate PDF for specific control number', async () => {
    // Arrange
    const mockReport = createMockReport('117376', null);
    mockRepo.findByControlNumber.mockResolvedValue(mockReport);

    const mockPdfService = {
      generatePoliceReportPdf: jest.fn()
        .mockResolvedValue(Buffer.from('PDF_CONTENT'))
    };

    const useCase = new GeneratePoliceReportUseCase(mockRepo, mockPdfService);

    // Act
    const result = await useCase.execute({
      controlNumber: '117376',
      format: 'PDF'
    });

    // Assert
    expect(result.pdfBuffer).toBeDefined();
    expect(result.fileName).toContain('police_report_117376');
    expect(mockPdfService.generatePoliceReportPdf).toHaveBeenCalledWith(mockReport);
  });

  it('should throw NotFoundError if control number not found', async () => {
    // Arrange
    mockRepo.findByControlNumber.mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute({ controlNumber: '999999' })
    ).rejects.toThrow('not found');
  });

  it('should return JSON when format is JSON', async () => {
    // Arrange
    const mockReport = createMockReport('117376', null);
    mockRepo.findByControlNumber.mockResolvedValue(mockReport);

    const mockPdfService = { generatePoliceReportPdf: jest.fn() };
    const useCase = new GeneratePoliceReportUseCase(mockRepo, mockPdfService);

    // Act
    const result = await useCase.execute({
      controlNumber: '117376',
      format: 'JSON'
    });

    // Assert
    expect(result.pdfBuffer.length).toBe(0); // No PDF
    expect(result.data).toBeDefined();
    expect(mockPdfService.generatePoliceReportPdf).not.toHaveBeenCalled();
  });
});
```

## Integration Testing

### Setup Test Database

```typescript
import { Pool } from 'pg';

const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL
});

beforeAll(async () => {
  // Run migrations
  await runMigrations(testPool);
});

afterAll(async () => {
  await testPool.end();
});

afterEach(async () => {
  // Clean up test data
  await testPool.query('DELETE FROM hold_item_inventory');
  await testPool.query('DELETE FROM hold_item');
  await testPool.query('DELETE FROM inventory_item');
  await testPool.query('DELETE FROM customer');
});
```

### Test with Real Repository

```typescript
describe('PgPoliceReportRepository - Integration', () => {
  let repo: PgPoliceReportRepository;

  beforeAll(() => {
    repo = new PgPoliceReportRepository(testPool);
  });

  it('should find active holds from database', async () => {
    // Arrange - Insert test data
    const customerId = await insertTestCustomer();
    const holdId = await insertTestHold(customerId);
    const itemId = await insertTestInventoryItem();
    await linkHoldToItem(holdId, itemId);

    // Act
    const reports = await repo.findActiveHolds();

    // Assert
    expect(reports).toHaveLength(1);
    expect(reports[0].controlNumber).toBeDefined();
    expect(reports[0].holdStatus).toBe('ACTIVE');
  });

  it('should find holds by date range', async () => {
    // Arrange
    const startDate = new Date('2025-10-01');
    const endDate = new Date('2025-10-31');
    // Insert test data with hold dates in range

    // Act
    const reports = await repo.findByCriteria({
      startDate,
      endDate
    });

    // Assert
    expect(reports).toHaveLength(1);
    reports.forEach(report => {
      expect(report.holdDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(report.holdDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });
  });

  it('should count active holds', async () => {
    // Insert multiple test records
    const count = await repo.countHolds();
    
    expect(count).toBeGreaterThan(0);
  });
});
```

## API Testing

### Using cURL

#### 1. Get Active Holds
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3001/api/reports/police/holds/active?limit=10"
```

**Expected Response:**
```json
{
  "totalCount": 5,
  "reportDate": "2025-12-30T10:30:00.000Z",
  "reports": [
    {
      "id": "uuid",
      "controlNumber": "117376",
      "customerFullName": "JUAN ALBERTO DEJESUS JR",
      "holdStatus": "ACTIVE",
      ...
    }
  ]
}
```

#### 2. Get Reports by Date Range
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3001/api/reports/police?startDate=2025-10-01T00:00:00Z&endDate=2025-10-31T23:59:59Z&agency=FMPD"
```

#### 3. Generate PDF
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"controlNumber":"117376","format":"PDF"}' \
  http://localhost:3001/api/reports/police/generate \
  --output report_117376.pdf
```

**Check HTTP status:**
```bash
curl -i -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"controlNumber":"117376","format":"PDF"}' \
  http://localhost:3001/api/reports/police/generate
```

Expected response headers:
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="police_report_117376_2025-12-30.pdf"
```

### Using Postman

1. **Create Collection:** Police Reports API

2. **Create Environment Variables:**
   - `base_url`: http://localhost:3001
   - `jwt_token`: YOUR_JWT_TOKEN
   - `control_number`: 117376

3. **Request: Get Active Holds**
   - Method: GET
   - URL: `{{base_url}}/api/reports/police/holds/active`
   - Headers: `Authorization: Bearer {{jwt_token}}`

4. **Request: Generate PDF**
   - Method: POST
   - URL: `{{base_url}}/api/reports/police/generate`
   - Headers: `Authorization: Bearer {{jwt_token}}`
   - Body (JSON):
     ```json
     {
       "controlNumber": "{{control_number}}",
       "format": "PDF"
     }
     ```
   - Right-click response → Send and Download → Save as PDF

## PDF Validation Testing

### Verify PDF Content

```typescript
import pdf from 'pdfjs-dist';

describe('PoliceReportPdfService', () => {
  it('should generate valid PDF with required content', async () => {
    // Arrange
    const report = createMockReport('117376', null);
    const service = new PoliceReportPdfService();

    // Act
    const pdfBuffer = await service.generatePoliceReportPdf(report);

    // Assert - PDF is valid
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    expect(pdfBuffer.toString('ascii', 0, 4)).toBe('%PDF'); // PDF header

    // Parse PDF content
    const pdfDoc = await pdf.getDocument({ data: pdfBuffer }).promise;
    expect(pdfDoc.numPages).toBeGreaterThan(0);

    // Verify text content
    const page = await pdfDoc.getPage(1);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str).join('');
    
    expect(text).toContain('POLICE HOLD REPORT');
    expect(text).toContain(report.controlNumber);
    expect(text).toContain(report.getFullCustomerName());
  });
});
```

### Visual Inspection

1. Generate PDF with test control number
2. Open in PDF viewer
3. Check:
   - ✅ Title "POLICE HOLD REPORT" visible
   - ✅ All sections present (Store, Transaction, Customer, etc.)
   - ✅ Data populated correctly
   - ✅ Proper formatting and spacing
   - ✅ Confidentiality footer visible

## Error Handling Tests

### Test 404 Not Found
```typescript
it('should return 404 for non-existent control number', async () => {
  const response = await fetch('http://localhost:3001/api/reports/police/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ controlNumber: '999999' })
  });

  expect(response.status).toBe(404);
  const data = await response.json();
  expect(data.message).toContain('not found');
});
```

### Test 400 Bad Request
```typescript
it('should return 400 for invalid input', async () => {
  const response = await fetch('http://localhost:3001/api/reports/police', {
    headers: { 'Authorization': `Bearer ${token}` },
    method: 'GET',
    // Invalid date format
    url: '?startDate=invalid-date'
  });

  expect(response.status).toBe(400);
});
```

### Test 401 Unauthorized
```typescript
it('should return 401 without valid token', async () => {
  const response = await fetch('http://localhost:3001/api/reports/police/holds/active');

  expect(response.status).toBe(401);
});
```

### Test 403 Forbidden
```typescript
it('should return 403 for non-admin user generating PDF', async () => {
  // Use token for user with 'sales_associate' role
  const response = await fetch('http://localhost:3001/api/reports/police/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${nonAdminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ controlNumber: '117376' })
  });

  expect(response.status).toBe(403);
});
```

## Performance Testing

### Load Test Query Endpoint

```bash
# Using Apache Bench
ab -n 1000 -c 10 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:3001/api/reports/police?limit=100"
```

### Measure PDF Generation Time

```typescript
it('should generate PDF within acceptable time', async () => {
  const report = createMockReport('117376', null);
  const service = new PoliceReportPdfService();

  const start = Date.now();
  await service.generatePoliceReportPdf(report);
  const duration = Date.now() - start;

  // Should complete within 100ms
  expect(duration).toBeLessThan(100);
});
```

## Test Data Helpers

```typescript
function createMockReport(controlNumber: string, releaseDate: Date | null): PoliceReport {
  return new PoliceReport({
    id: crypto.randomUUID(),
    controlNumber,
    storeName: 'TEST STORE',
    storeAddress: '123 TEST ST',
    storeCity: 'TEST CITY',
    storeState: 'TS',
    storeZip: '12345',
    storePhone: '(123) 456-7890',
    transactionDate: new Date('2025-10-08'),
    transactionTime: '10:17:00',
    transactionType: 'PAWN',
    customerFirstName: 'JOHN',
    customerMiddleName: 'TEST',
    customerLastName: 'CUSTOMER',
    customerDob: new Date('1980-01-01'),
    customerGender: 'M',
    customerAddress: '456 MAIN ST',
    customerCity: 'TEST CITY',
    customerState: 'TS',
    customerZip: '12345',
    customerPhone: '(123) 456-7890',
    customerEmployer: 'TEST EMPLOYER',
    customerIdType: 'DRIVERS',
    customerIdNumber: 'AB123456',
    customerHeight: "5' 11\"",
    customerWeight: 200,
    customerHairColor: 'BROWN',
    customerEyeColor: 'BLUE',
    itemType: 'RING',
    itemBrand: 'NONE',
    itemDescription: 'TEST RING',
    itemMetalType: 'RY',
    itemKarat: 14,
    itemWeight: 5.1,
    itemSize: 'M9',
    itemQuantity: 1,
    itemAmount: 200,
    itemStatus: 'P',
    recordType: 'J',
    holdDate: new Date('2025-10-08'),
    holdAgency: 'TEST POLICE DEPT',
    holdCaseNumber: '2025-00001',
    holdDateOut: releaseDate,
    reportDate: new Date(),
    reportGeneratedAt: new Date(),
    generatedBy: 'test',
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
```

## Test Coverage Goals

| Layer | Target | Files |
|-------|--------|-------|
| Use Cases | 90%+ | 3 files |
| Repository | 85%+ | 1 file |
| Mapper | 95%+ | 1 file |
| Service | 80%+ | 1 file |
| Controller | 85%+ | 1 file (integration) |

## Running Tests

```bash
# Unit tests only
npm test -- src/application/use-case/reports/police

# Integration tests
npm test -- tests/integration/reports/police

# All tests with coverage
npm test -- --coverage

# Specific test file
npm test -- GetPoliceReportsUseCase.test.ts

# Watch mode
npm test -- --watch
```

---

**Note:** All test files should be created in a `tests/` directory mirroring the source structure. Refer to existing test patterns in the project for consistency.
