# Police Report Service Documentation

## Overview

The Police Report Service generates formatted reports for police holds tracked in the system. It retrieves data from hold items and inventory, formats them for presentation, and can generate PDF documents for distribution to law enforcement agencies.

## Architecture

Following Clean Architecture principles, the service is organized into layers:

```
Domain Layer (PoliceReport entity, PoliceReportRepository interface)
    ↓
Infrastructure Layer (PgPoliceReportRepository, SQL queries)
    ↓
Application Layer (Use Cases, DTOs, Mappers)
    ↓
Interface Layer (Controller, Routes)
```

## File Structure

```
src/
├── domains/reports/police/
│   ├── PoliceReport.ts              # Entity with domain logic
│   └── PoliceReportRepository.ts    # Repository interface
├── infrastructure/
│   ├── db/sql/queries/reports/police/
│   │   ├── police_holds_active.sql
│   │   ├── police_holds_by_agency.sql
│   │   ├── police_holds_by_date_range.sql
│   │   ├── police_hold_by_control_number.sql
│   │   └── police_holds_count.sql
│   └── persistence/reports/police/
│       └── PgPoliceReportRepository.ts
├── application/
│   ├── dto/reports/police/
│   │   ├── command/
│   │   │   └── GeneratePoliceReportRequestDto.ts
│   │   └── query/
│   │       ├── PoliceReportResponseDto.ts
│   │       └── GetPoliceReportsRequestDto.ts
│   ├── mapping/reports/police/
│   │   └── policeReportMapper.ts
│   ├── service/reports/
│   │   └── PoliceReportPdfService.ts
│   └── use-case/reports/police/
│       ├── command/
│       │   └── GeneratePoliceReportUseCase.ts
│       └── query/
│           ├── GetPoliceReportsUseCase.ts
│           └── GetActivePoliceHoldsUseCase.ts
└── interfaces/http/
    ├── controller/reports/police/
    │   └── PoliceReportController.ts
    └── route/reports/police/
        └── policeReportRoute.ts
```

## API Endpoints

### 1. Get Police Reports by Criteria
```
GET /api/reports/police
```
**Query Parameters:**
- `startDate` (optional): ISO 8601 date-time
- `endDate` (optional): ISO 8601 date-time
- `agency` (optional): Police agency name
- `limit` (optional, default: 100): Records per page
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "totalCount": 15,
  "reportDate": "2025-12-30T10:30:00.000Z",
  "agency": "Fort Myers Police Department",
  "reports": [
    {
      "id": "uuid",
      "controlNumber": "117376",
      "storeName": "LARRY'S ESTATE JEWELRY & PAWN",
      "storeAddress": "3316 CLEVELAND AVE.",
      "storeCity": "FORT MYERS",
      "storeState": "FL",
      "storeZip": "33901",
      "storePhone": "(239) 939-3633",
      "transactionDate": "2025-10-08T00:00:00.000Z",
      "transactionTime": "10:17:00",
      "transactionType": "PAWN",
      "customerFullName": "JUAN ALBERTO DEJESUS JR",
      "customerDob": "1980-06-25T00:00:00.000Z",
      "customerGender": "M",
      "customerAddress": "2096 RUTLAND ST",
      "customerCity": "OPA LOCKA",
      "customerState": "FL",
      "customerZip": "33054",
      "customerPhone": "(305) 570-6960",
      "customerEmployer": "RAYS PRO PAINTING",
      "customerIdType": "FL DRIVERS",
      "customerIdNumber": "D22242180225",
      "customerHeight": "5' 11\"",
      "customerWeight": 210,
      "customerHairColor": "BROWN",
      "customerEyeColor": "BLACK",
      "items": [
        {
          "controlNumber": "117376",
          "itemType": "RING",
          "itemBrand": "NONE",
          "itemDescription": "YELLOW 10K MANS CZ CLUSTER RING 5.1GRMS",
          "itemQuantity": 1,
          "itemAmount": 200.00,
          "itemStatus": "P",
          "recordType": "J"
        }
      ],
      "holdDate": "2025-10-08T00:00:00.000Z",
      "holdAgency": "Fort Myers Police Department",
      "holdCaseNumber": "2025-12345",
      "holdDateOut": null,
      "holdStatus": "ACTIVE",
      "reportDate": "2025-12-30T00:00:00.000Z",
      "generatedAt": "2025-12-30T10:30:00.000Z",
      "generatedBy": "system"
    }
  ]
}
```

### 2. Get Active Police Holds
```
GET /api/reports/police/holds/active
```
**Query Parameters:**
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)

**Response:** Same format as Get Police Reports, filtered to active holds only

### 3. Generate Police Report PDF
```
POST /api/reports/police/generate
```
**Request Body:**
```json
{
  "controlNumber": "117376",
  "format": "PDF",
  "includeActiveOnly": true
}
```

**Parameters:**
- `controlNumber` (optional): Specific hold to generate report for
- `format` (optional, default: "PDF"): "PDF" or "JSON"
- `includeActiveOnly` (optional, default: true): Only include active holds

**Response (PDF):**
- Returns PDF file with `Content-Type: application/pdf`
- Filename: `police_report_117376_2025-12-30.pdf`

**Response (JSON):**
```json
{
  "data": { ... same as Get Reports ... },
  "message": "Report generated successfully"
}
```

## Domain Model

### PoliceReport Entity
Core business entity representing a police hold report.

**Key Fields:**
- Control number (unique transaction identifier)
- Store information (name, address, phone)
- Transaction details (date, time, type)
- Customer information (name, DOB, address, ID)
- Physical description (height, weight, hair/eye color)
- Item details (type, brand, description, amount)
- Hold information (date, agency, case number, date released)

**Methods:**
- `getFullCustomerName()`: Formatted customer name
- `getFullCustomerAddress()`: Formatted customer address
- `getFullStoreAddress()`: Formatted store address

## Use Cases

### GetPoliceReportsUseCase
Retrieves police reports based on date range, agency, and pagination.

**Input:** GetPoliceReportsRequestDto
- `startDate`: Search start date
- `endDate`: Search end date
- `agency`: Filter by agency
- `limit`: Page size (default 100)
- `offset`: Pagination offset (default 0)

**Output:** PoliceReportsListDto

**Implementation:**
1. Validates input with Zod schema
2. Builds database criteria
3. Fetches reports from repository
4. Maps to response DTOs
5. Returns list with metadata

### GetActivePoliceHoldsUseCase
Retrieves all currently active (not yet released) police holds.

**Input:** GetActivePoliceHoldsRequestDto
- `limit`: Page size
- `offset`: Pagination offset

**Output:** PoliceReportsListDto

### GeneratePoliceReportUseCase
Generates a formatted PDF or JSON report for a police hold.

**Input:** GeneratePoliceReportRequestDto
- `controlNumber`: (optional) Specific hold to report on
- `format`: "PDF" or "JSON" (default: "PDF")
- `includeActiveOnly`: Only active holds (default: true)

**Output:** 
```
{
  data: PoliceReportResponseDto,
  pdfBuffer: Buffer,
  fileName: string
}
```

**Implementation:**
1. Validates input
2. Fetches report (by control number or first active hold)
3. Throws NotFoundError if not found
4. Generates PDF via PoliceReportPdfService
5. Returns PDF buffer and metadata

## PDF Generation

### PoliceReportPdfService
Generates formatted PDF documents using PDFKit.

**Method:** `generatePoliceReportPdf(report: PoliceReport): Promise<Buffer>`

**PDF Structure:**
1. Title: "POLICE HOLD REPORT"
2. Report metadata (date generated, generated by)
3. Store Information section
4. Transaction Information section
5. Customer Information section
6. Physical Description section
7. Item Information section
8. Police Hold Information section
9. Footer with confidentiality notice

**Features:**
- Professional formatting with sections and dividers
- Proper font sizing and styling
- Handles null/undefined values gracefully
- Returns Buffer for streaming or file saving

## Database Queries

### police_holds_active.sql
Returns all active police holds with full customer and item information.

**Join chain:**
```
hold_item
  ├─ customer (customer info)
  ├─ hold_item_inventory (junction)
  ├─ inventory_item (item details)
  ├─ inventory_subcategory (item category)
  └─ inventory_brand (item brand)
```

### police_holds_by_agency.sql
Returns holds for specific agency with pagination.
**Parameters:** agency, limit, offset

### police_holds_by_date_range.sql
Returns holds within date range, optionally filtered by agency.
**Parameters:** startDate, endDate, agency (nullable), limit, offset

### police_hold_by_control_number.sql
Returns single hold by control number.
**Parameters:** controlNumber

### police_holds_count.sql
Returns total count of active holds.

## Error Handling

All errors are caught and passed to Express error middleware.

**Common Errors:**
- `NotFoundError`: Police hold not found (404)
- `ValidationError` (from Zod): Invalid input (400)
- Database errors: Connection or query failures (500)

## DTOs

### GeneratePoliceReportRequestDto
Request DTO for PDF generation command.

```typescript
{
  startDate?: string;        // ISO 8601
  endDate?: string;          // ISO 8601
  agency?: string;
  controlNumber?: string;
  format: 'PDF' | 'JSON';    // default: 'PDF'
  includeActiveOnly: boolean; // default: true
}
```

### GetPoliceReportsRequestDto
Query parameters for fetching reports.

```typescript
{
  startDate?: string;
  endDate?: string;
  agency?: string;
  limit?: number;    // 1-500, default: 100
  offset?: number;   // default: 0
}
```

### PoliceReportResponseDto
Single report response.

```typescript
{
  id: string;
  controlNumber: string;
  storeName: string;
  storeAddress: string;
  storeCity: string;
  storeState: string;
  storeZip: string;
  storePhone: string;
  transactionDate: string;
  transactionTime: string;
  transactionType: string;
  customerFullName: string;
  customerDob: string;
  customerGender: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  customerPhone: string;
  customerEmployer: string;
  customerIdType: string;
  customerIdNumber: string;
  customerHeight: string;
  customerWeight: number;
  customerHairColor: string;
  customerEyeColor: string;
  items: PoliceReportItemDto[];
  holdDate: string;
  holdAgency: string;
  holdCaseNumber: string;
  holdDateOut: string | null;
  holdStatus: 'ACTIVE' | 'RELEASED';
  reportDate: string;
  generatedAt: string;
  generatedBy: string;
}
```

### PoliceReportsListDto
List of reports with metadata.

```typescript
{
  totalCount: number;
  reportDate: string;
  agency?: string;
  reports: PoliceReportResponseDto[];
}
```

## Controller

### PoliceReportController

**Methods:**

#### getReports()
```
GET /api/reports/police
Returns: PoliceReportsListDto
```
Extracts query parameters and calls GetPoliceReportsUseCase.

#### getActiveHolds()
```
GET /api/reports/police/holds/active
Returns: PoliceReportsListDto
```
Retrieves only currently active holds.

#### generateReport()
```
POST /api/reports/police/generate
Request: GeneratePoliceReportRequestDto
Returns: PDF file (application/pdf) or JSON
```
Generates PDF and sends as attachment or returns JSON.

## Middleware

All endpoints require:
- `authenticate()` middleware - JWT token validation
- `/generate` additionally requires `requireRole(['admin', 'manager'])` - Role-based access control

## Dependencies in Container

The service is wired in `src/container.ts`:

```typescript
// Repository
const policeReportRepo = new PgPoliceReportRepository(pool);

// Service
const policeReportPdfService = new PoliceReportPdfService();

// Use Cases
const getPoliceReportsUseCase = new GetPoliceReportsUseCase(policeReportRepo);
const getActivePoliceHoldsUseCase = new GetActivePoliceHoldsUseCase(policeReportRepo);
const generatePoliceReportUseCase = new GeneratePoliceReportUseCase(
  policeReportRepo,
  policeReportPdfService
);

// Controller
const policeReportController = new PoliceReportController(
  getPoliceReportsUseCase,
  getActivePoliceHoldsUseCase,
  generatePoliceReportUseCase
);

// Routes
app.use('/api/reports/police', createPoliceReportRouter(
  policeReportController,
  env.jwtSecret
));
```

## Future Enhancements

1. **Batch PDF Generation**: Generate multiple reports in single request
2. **Email Distribution**: Auto-send PDFs to law enforcement agencies
3. **Report Templates**: Support multiple report formats for different agencies
4. **Archival**: Store generated reports in database for audit trail
5. **Search & Filter**: Advanced filtering by item type, description, etc.
6. **Notifications**: Webhook notifications when holds are released
7. **Export Formats**: Support CSV, Excel export in addition to PDF

## Testing

Unit tests for use cases should mock the repository:

```typescript
const mockRepo = {
  findByCriteria: jest.fn(),
  findActiveHolds: jest.fn(),
  findByControlNumber: jest.fn(),
  findByAgency: jest.fn(),
  create: jest.fn(),
  countHolds: jest.fn()
} as jest.Mocked<PoliceReportRepository>;

const useCase = new GetPoliceReportsUseCase(mockRepo);
```

## Notes

- PDF service uses PDFKit library
- All dates/times use ISO 8601 format in API responses
- Customer data is read-only (from existing Customer entity)
- Hold dates determine active vs. released status
- Control numbers uniquely identify transactions
- Multiple items can be in single transaction (multiple rows, same control number)
