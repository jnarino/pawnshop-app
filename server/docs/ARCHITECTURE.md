# Project Architecture Visual Guide

## Complete Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP REQUEST                             │
│                  GET /api/customer/123                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INTERFACE LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Route (customerRoute.ts)                                 │   │
│  │  - Registers endpoint pattern                             │   │
│  │  - Applies middleware (auth, roles)                       │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │  Middleware                                               │   │
│  │  - authenticate(jwtSecret)                                │   │
│  │  - requireRole(['admin', 'manager'])                      │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │  Controller (CustomerController.ts)                       │   │
│  │  getById = async (req, res, next) => {                    │   │
│  │    const result = await useCase.execute({                 │   │
│  │      id: req.params.id                                    │   │
│  │    });                                                     │   │
│  │    return res.json(result);                               │   │
│  │  }                                                         │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Use Case (GetCustomerByIdUseCase.ts)                     │   │
│  │                                                            │   │
│  │  async execute(input: unknown): Promise<CustomerDto> {    │   │
│  │    // 1. VALIDATE INPUT                                   │   │
│  │    const { id } = schema.parse(input);                    │   │
│  │                                                            │   │
│  │    // 2. BUSINESS LOGIC                                   │   │
│  │    const customer = await repo.findById(id);              │   │
│  │    if (!customer) throw NotFoundError();                  │   │
│  │                                                            │   │
│  │    // 3. MAP TO DTO                                       │   │
│  │    return toCustomerResponseDto(customer);                │   │
│  │  }                                                         │   │
│  └────────┬───────────────────┬───────────────┬──────────────┘   │
│           │                   │               │                  │
│  ┌────────▼────────┐ ┌────────▼──────┐ ┌─────▼──────────────┐   │
│  │  Request DTO    │ │  Response DTO │ │  Mapper            │   │
│  │  (Zod Schema)   │ │  (Type Alias) │ │  entity → DTO      │   │
│  └─────────────────┘ └───────────────┘ └────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Repository Interface (CustomerRepository.ts)             │   │
│  │                                                            │   │
│  │  export interface CustomerRepository {                    │   │
│  │    findById(id: string): Promise<Customer | null>;        │   │
│  │    create(customer: Customer): Promise<Customer>;         │   │
│  │    update(customer: Customer): Promise<Customer>;         │   │
│  │    delete(id: string): Promise<void>;                     │   │
│  │  }                                                         │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │  Entity (Customer.ts)                                     │   │
│  │                                                            │   │
│  │  export class Customer {                                  │   │
│  │    readonly id: string;                                   │   │
│  │    firstName: string;                                     │   │
│  │    lastName: string;                                      │   │
│  │    // ...business logic methods                           │   │
│  │  }                                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Repository Implementation (PgCustomerRepository.ts)      │   │
│  │                                                            │   │
│  │  const sqlFindById = loadSql('queries',                   │   │
│  │    'customer/customer_find_by_id');                       │   │
│  │                                                            │   │
│  │  export class PgCustomerRepository                        │   │
│  │          implements CustomerRepository {                  │   │
│  │                                                            │   │
│  │    async findById(id: string): Promise<Customer | null> { │   │
│  │      const result = await this.pool.query(                │   │
│  │        sqlFindById,                                        │   │
│  │        [id]                                                │   │
│  │      );                                                    │   │
│  │      return this.mapRow(result.rows[0]);                  │   │
│  │    }                                                       │   │
│  │  }                                                         │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │  SQL File (customer_find_by_id.sql)                       │   │
│  │                                                            │   │
│  │  SELECT                                                    │   │
│  │    c.id,                                                   │   │
│  │    c.first_name,                                           │   │
│  │    c.last_name,                                            │   │
│  │    c.phone_number                                          │   │
│  │  FROM customer c                                           │   │
│  │  WHERE c.id = $1;                                          │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   PostgreSQL  │
                    │   Database    │
                    └───────────────┘
                            │
                            │
                    (Response flows back up)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HTTP RESPONSE                               │
│  {                                                               │
│    "id": "123",                                                  │
│    "firstName": "John",                                          │
│    "lastName": "Doe",                                            │
│    "phoneNumber": "+1234567890"                                 │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### 🌐 Interface Layer
**Location:** `src/interfaces/http/`

**Components:**
- Routes
- Controllers
- Middleware

**Responsibilities:**
- HTTP protocol handling
- Request parsing
- Response formatting
- Authentication/Authorization
- Error serialization

**Rules:**
- ✅ Extract data from HTTP request
- ✅ Call use cases
- ✅ Return HTTP responses
- ❌ No business logic
- ❌ No database access

---

### 💼 Application Layer
**Location:** `src/application/`

**Components:**
- Use Cases (Commands/Queries)
- DTOs (Data Transfer Objects)
- Mappers
- Services

**Responsibilities:**
- Business logic orchestration
- Input validation
- DTO mapping
- Transaction coordination

**Rules:**
- ✅ Validate input (Zod)
- ✅ Coordinate repositories
- ✅ Apply business rules
- ✅ Return DTOs
- ❌ No HTTP knowledge
- ❌ No database details

---

### 🏛️ Domain Layer
**Location:** `src/domains/`

**Components:**
- Entities (Business Objects)
- Repository Interfaces
- Value Objects

**Responsibilities:**
- Core business logic
- Domain rules
- Entity behavior
- Define contracts

**Rules:**
- ✅ Pure business logic
- ✅ No dependencies on other layers
- ✅ Framework-agnostic
- ❌ No infrastructure details
- ❌ No DTOs

---

### 🔧 Infrastructure Layer
**Location:** `src/infrastructure/`

**Components:**
- Repository Implementations
- Database connections
- External API clients
- File system

**Responsibilities:**
- Data persistence
- External service integration
- Technical details

**Rules:**
- ✅ Implement domain interfaces
- ✅ Database queries
- ✅ External API calls
- ❌ No business logic

---

## Dependency Direction

```
┌──────────────┐
│  Interface   │───┐
└──────────────┘   │
                   │
┌──────────────┐   │
│ Application  │◄──┤
└──────────────┘   │
       ▲           │
       │           │
┌──────┴───────┐   │
│    Domain    │◄──┘
└──────────────┘
       ▲
       │
┌──────┴───────┐
│Infrastructure│
└──────────────┘

Dependencies point INWARD
Outer layers depend on inner layers
Inner layers know nothing about outer layers
```

---

## File Organization Pattern

```
src/
├── domains/                           # INNERMOST (no dependencies)
│   └── customer/
│       ├── Customer.ts                # Entity
│       └── CustomerRepository.ts      # Interface
│
├── infrastructure/                    # OUTERMOST (implements domain)
│   ├── db/
│   │   └── sql/
│   │       ├── queries/
│   │       │   └── customer/
│   │       │       └── customer_find_by_id.sql
│   │       └── commands/
│   │           └── customer/
│   │               └── customer_create.sql
│   └── persistence/
│       └── customer/
│           └── PgCustomerRepository.ts  # Implementation
│
├── application/                       # MIDDLE (uses domain)
│   ├── dto/
│   │   └── customer/
│   │       ├── command/
│   │       │   └── CreateCustomerRequestDto.ts
│   │       └── query/
│   │           └── CustomerResponseDto.ts
│   ├── mapping/
│   │   └── customer/
│   │       └── customerMapper.ts
│   └── use-case/
│       └── customer/
│           ├── command/
│           │   └── CreateCustomerUseCase.ts
│           └── query/
│               └── GetCustomerByIdUseCase.ts
│
└── interfaces/                        # OUTER (uses application)
    └── http/
        ├── controller/
        │   └── customer/
        │       └── CustomerController.ts
        ├── middleware/
        │   ├── authMiddleware.ts
        │   └── roleMiddleware.ts
        └── route/
            └── customer/
                └── customerRoute.ts
```

---

## Command vs Query Pattern (CQRS)

### Query (Read Operations)

```
GET Request
    ↓
Controller
    ↓
Query Use Case
    ↓
Repository.findById()
    ↓
SELECT query
    ↓
Map to DTO
    ↓
Return DTO
```

**Characteristics:**
- No state changes
- Safe to retry
- Can be cached
- Returns data
- Folder: `use-case/query/`

**Examples:**
- `GetCustomerByIdUseCase`
- `FindCustomerUseCase`
- `ListCustomersUseCase`

---

### Command (Write Operations)

```
POST/PUT/DELETE Request
    ↓
Controller
    ↓
Command Use Case
    ↓
Validate + Business Rules
    ↓
Create/Update Domain Entity
    ↓
Repository.create/update/delete()
    ↓
INSERT/UPDATE/DELETE query
    ↓
Return DTO
```

**Characteristics:**
- Changes state
- Not idempotent (usually)
- Side effects
- Returns created/updated data
- Folder: `use-case/command/`

**Examples:**
- `CreateCustomerUseCase`
- `UpdateCustomerUseCase`
- `DeleteCustomerUseCase`

---

## Transaction Handling

### Simple Operation (Single Repository Call)
```typescript
// No transaction needed
async execute(input: unknown): Promise<CustomerDto> {
  const dto = schema.parse(input);
  const customer = new Customer(dto);
  const created = await this.repo.create(customer);
  return toCustomerDto(created);
}
```

### Complex Operation (Multiple Repositories)
```typescript
// Use Unit of Work pattern
async execute(input: unknown): Promise<PawnTicketDto> {
  const dto = schema.parse(input);
  
  return await this.unitOfWork.withTransaction(async (txRepos) => {
    // Create ticket
    const ticket = await txRepos.pawnTicket.create(pawnTicket);
    
    // Create items
    for (const item of items) {
      await txRepos.inventoryItem.create(item);
    }
    
    // All or nothing
    return toPawnTicketDto(ticket);
  });
}
```

---

## Error Handling Flow

```
┌─────────────────┐
│   Use Case      │
│  (throws error) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Controller    │
│  next(err)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Error          │
│  Middleware     │
│  (formats)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTTP Response  │
│  { error: ... } │
└─────────────────┘
```

**Common Errors:**
- `NotFoundError` → 404
- `ValidationError` (Zod) → 400
- `UnauthorizedError` → 401
- `ForbiddenError` → 403
- Generic Error → 500

---

## Dependency Injection Pattern

```typescript
// container.ts - Wire everything together

export async function createApp() {
  // 1. Create infrastructure (outermost)
  const pool = createPool();
  
  // 2. Create repositories (infrastructure)
  const customerRepo = new PgCustomerRepository(pool);
  
  // 3. Create use cases (application)
  const getCustomerUseCase = new GetCustomerByIdUseCase(customerRepo);
  const createCustomerUseCase = new CreateCustomerUseCase(customerRepo);
  
  // 4. Create controllers (interface)
  const customerController = new CustomerController(
    getCustomerUseCase,
    createCustomerUseCase
  );
  
  // 5. Create routes (interface)
  const customerRouter = createCustomerRouter(
    customerController,
    env.jwtSecret
  );
  
  // 6. Create app
  const app = express();
  app.use('/api/customer', customerRouter);
  
  return app;
}
```

---

## Testing Strategy

### Unit Tests (Use Cases)
```typescript
// Mock repositories
const mockRepo = { findById: jest.fn() };
const useCase = new GetCustomerByIdUseCase(mockRepo);

// Test use case logic
mockRepo.findById.mockResolvedValue(customer);
const result = await useCase.execute({ id: '123' });
```

### Integration Tests (Controllers)
```typescript
// Test with real database
const app = await createApp();
const response = await supertest(app)
  .get('/api/customer/123')
  .set('Authorization', `Bearer ${token}`);

expect(response.status).toBe(200);
```

---

## Summary

**Key Principles:**
1. ✅ Separation of Concerns - each layer has one job
2. ✅ Dependency Inversion - depend on interfaces, not implementations
3. ✅ Single Responsibility - classes do one thing
4. ✅ Explicit Dependencies - inject everything
5. ✅ Test Friendly - easy to mock and test

**Benefits:**
- 🧪 Testable (can mock any layer)
- 🔄 Maintainable (changes isolated)
- 🔧 Flexible (swap implementations)
- 📚 Understandable (clear structure)
- 🚀 Scalable (add features easily)

**Remember:** Keep dependencies flowing inward! Inner layers should never know about outer layers.
