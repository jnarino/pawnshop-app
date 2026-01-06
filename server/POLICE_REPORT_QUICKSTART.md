# Police Report Service - Quick Start

## What Was Created

A complete police report management service following Clean Architecture that retrieves police hold information from the database and generates formatted reports (PDF or JSON) for law enforcement agencies.

## Folder Structure Created

```
src/
├── domains/reports/police/
│   ├── PoliceReport.ts              ← Entity with domain logic
│   └── PoliceReportRepository.ts    ← Repository interface
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
│   ├── dto/reports/police/command/
│   │   └── GeneratePoliceReportRequestDto.ts
│   ├── dto/reports/police/query/
│   │   ├── PoliceReportResponseDto.ts
│   │   └── GetPoliceReportsRequestDto.ts
│   ├── mapping/reports/police/
│   │   └── policeReportMapper.ts
│   ├── service/reports/
│   │   └── PoliceReportPdfService.ts
│   └── use-case/reports/police/
│       ├── command/GeneratePoliceReportUseCase.ts
│       └── query/
│           ├── GetPoliceReportsUseCase.ts
│           └── GetActivePoliceHoldsUseCase.ts
└── interfaces/http/
    ├── controller/reports/police/
    │   └── PoliceReportController.ts
    └── route/reports/police/
        └── policeReportRoute.ts
```

## 3 Main API Endpoints

### 1. Get Reports by Criteria
```bash
GET /api/reports/police?startDate=2025-10-01&endDate=2025-10-31&agency=FMPD&limit=100
```
Returns list of police hold reports matching criteria.

### 2. Get Active Holds
```bash
GET /api/reports/police/holds/active?limit=100
```
Returns only currently active holds (not yet released).

### 3. Generate Report PDF
```bash
POST /api/reports/police/generate
Content-Type: application/json

{
  "controlNumber": "117376",
  "format": "PDF"
}
```
Returns PDF file for download or JSON response.

## Architecture Layers

1. **Domain** - PoliceReport entity, repository interface
2. **Infrastructure** - SQL queries, repository implementation (PostgreSQL)
3. **Application** - Use cases, DTOs, mappers, PDF service
4. **Interface** - Controller, routes, middleware

## Key Features

✅ **Query Police Holds** - By date range, agency, control number
✅ **PDF Generation** - Professional formatted reports using PDFKit
✅ **Clean Architecture** - Strict layer separation, dependency injection
✅ **Database Integration** - Queries from hold_item, customer, inventory tables
✅ **Zod Validation** - Input validation for all requests
✅ **Role-Based Access** - Admin/manager required for report generation
✅ **Error Handling** - Comprehensive error handling with middleware

## Database Queries

All data is queried from existing tables:
- `hold_item` - Police hold records
- `customer` - Customer information
- `inventory_item` - Item details
- `inventory_subcategory` - Item categories
- `inventory_brand` - Item brands

## PDF Report Contents

1. Title and metadata
2. Store information
3. Transaction details
4. Customer information + physical description
5. Item information
6. Police hold details
7. Confidentiality notice

## Required Dependencies

```json
{
  "pdfkit": "^0.13.0"  // For PDF generation
}
```

Install with: `npm install pdfkit`

## Environment & Security

- **Authentication Required** - All endpoints require JWT token
- **Role-Based Access** - PDF generation requires admin/manager role
- **Data Validation** - Zod schemas validate all inputs
- **Error Handling** - All errors logged and returned properly

## Next Steps for Frontend

1. Call `GET /api/reports/police` to list reports
2. Use query parameters to filter by date range and agency
3. Call `POST /api/reports/police/generate` with controlNumber to get PDF
4. Handle PDF response with `Content-Type: application/pdf` header
5. Use filename from `Content-Disposition` header to save file

## Example Frontend Integration

```typescript
// Fetch reports
const response = await fetch('/api/reports/police?startDate=2025-10-01', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

// Generate PDF
const pdfResponse = await fetch('/api/reports/police/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ controlNumber: '117376', format: 'PDF' })
});

// Get filename from header
const filename = pdfResponse.headers
  .get('content-disposition')
  .split('filename="')[1]
  .split('"')[0];

// Download PDF
const blob = await pdfResponse.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();
```

## Testing the Service

```bash
# Get all active holds
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/reports/police/holds/active

# Get reports by date
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3001/api/reports/police?startDate=2025-10-01&endDate=2025-10-31"

# Generate PDF
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"controlNumber":"117376","format":"PDF"}' \
  http://localhost:3001/api/reports/police/generate \
  --output report.pdf
```

## Documentation Files

- [POLICE_REPORT_SERVICE.md](./POLICE_REPORT_SERVICE.md) - Complete technical documentation
- [DAILY_REPORT_FORMAT.md](./DAILY_REPORT_FORMAT.md) - Data format analysis
- Existing architecture docs at [ARCHITECTURE.md](./ARCHITECTURE.md)

## Troubleshooting

**404 on endpoint?**
- Make sure JWT token is valid
- Check that route is registered in `src/interfaces/http/index.ts`
- Verify controller is wired in `src/container.ts`

**PDF not generating?**
- Ensure `pdfkit` package is installed: `npm install pdfkit`
- Check that PoliceReportPdfService is instantiated in container
- Verify PDF buffer is being returned correctly

**No data returned?**
- Check that hold_item records exist in database with is_hold=true
- Verify customer records are linked to holds
- Review SQL queries in `src/infrastructure/db/sql/queries/reports/police/`

**Auth errors?**
- Ensure JWT token is passed in Authorization header
- Check token has not expired
- Verify user has appropriate role for /generate endpoint

---

**Ready to go!** The service is fully integrated and ready for use. All dependencies are wired in container.ts and routes are registered.
