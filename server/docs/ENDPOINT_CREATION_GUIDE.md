# Complete Guide: Creating New Endpoints Layer by Layer

## Architecture Overview

This project follows **Clean Architecture / Domain-Driven Design (DDD)** principles with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│  Interface Layer (HTTP)                                  │
│  Routes → Controllers → Middleware                       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Application Layer                                       │
│  Use Cases → DTOs → Mappers → Services                  │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Domain Layer                                            │
│  Entities → Repository Interfaces → Business Logic      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Infrastructure Layer                                    │
│  Repository Implementations → Database → External APIs   │
└─────────────────────────────────────────────────────────┘
```

### Request Flow

```
HTTP Request
    ↓
Route (registers endpoint)
    ↓
Middleware (auth, validation)
    ↓
Controller (orchestrates)
    ↓
Use Case (business logic)
    ↓
Repository Interface (abstraction)
    ↓
Repository Implementation (data access)
    ↓
Database
    ↓
Response flows back up
```

---

## Step-by-Step: Creating a New Endpoint

Let's create a complete example: **"Get Customer Orders"** endpoint.

### Step 1: Domain Layer (Define the Contract)

**File: `src/domains/customer/CustomerRepository.ts`**

Add method to the repository interface:

```typescript
export interface CustomerRepository {
  // ...existing methods...
  
  /**
   * Get all orders for a customer
   */
  findOrdersByCustomerId(customerId: string): Promise<Order[]>;
}
```

**Why?** Domain layer defines *what* needs to happen, not *how*.

---

### Step 2: Infrastructure Layer (Implement Data Access)

**File: `src/infrastructure/persistence/customer/PgCustomerRepository.ts`**

```typescript
import { loadSql } from '../../db/sqlLoader';

// Load SQL at module level
const sqlFindOrdersByCustomerId = loadSql('queries', 'customer/customer_orders_by_id');

export class PgCustomerRepository implements CustomerRepository {
  constructor(private readonly pool: Pool) {}
  
  // ...existing methods...
  
  async findOrdersByCustomerId(customerId: string): Promise<Order[]> {
    const result = await this.pool.query(sqlFindOrdersByCustomerId, [customerId]);
    return result.rows.map(row => this.mapOrderRow(row));
  }
  
  private mapOrderRow(row: any): Order {
    return new Order({
      id: row.id,
      customerId: row.customer_id,
      orderDate: new Date(row.order_date),
      total: parseFloat(row.total),
      // ...map all fields
    });
  }
}
```

**File: `src/infrastructure/db/sql/queries/customer/customer_orders_by_id.sql`**

```sql
SELECT 
  o.id,
  o.customer_id,
  o.order_date,
  o.total,
  o.status
FROM orders o
WHERE o.customer_id = $1
ORDER BY o.order_date DESC;
```

**Why?** Separate SQL from code for maintainability and testability.

---

### Step 3: Application Layer - DTOs (Data Transfer Objects)

#### Input DTO (Request)

**File: `src/application/dto/customer/query/GetCustomerOrdersRequestDto.ts`**

```typescript
import { z } from 'zod';

export const getCustomerOrdersRequestSchema = z.object({
  customerId: z.string().uuid()
});

export type GetCustomerOrdersRequestDto = z.infer<typeof getCustomerOrdersRequestSchema>;
```

#### Output DTO (Response)

**File: `src/application/dto/customer/query/CustomerOrderResponseDto.ts`**

```typescript
export type CustomerOrderResponseDto = {
  id: string;
  customerId: string;
  orderDate: string; // ISO format
  total: number;
  status: string;
};
```

**Why?** DTOs provide:
- Input validation with Zod
- Type safety
- Decoupling from domain entities
- API contract definition

---

### Step 4: Application Layer - Mapper

**File: `src/application/mapping/customer/customerMapper.ts`**

```typescript
import { Order } from '../../../domains/customer/Order';
import { CustomerOrderResponseDto } from '../../dto/customer/query/CustomerOrderResponseDto';

export function toCustomerOrderResponseDto(order: Order): CustomerOrderResponseDto {
  return {
    id: order.id,
    customerId: order.customerId,
    orderDate: order.orderDate.toISOString(),
    total: order.total,
    status: order.status
  };
}
```

**Why?** Mappers convert between domain entities and DTOs, keeping layers independent.

---

### Step 5: Application Layer - Use Case

**File: `src/application/use-case/customer/query/GetCustomerOrdersUseCase.ts`**

```typescript
import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import { NotFoundError } from '../../../common/errors';
import { CustomerOrderResponseDto } from '../../../dto/customer/query/CustomerOrderResponseDto';
import { 
  GetCustomerOrdersRequestDto, 
  getCustomerOrdersRequestSchema 
} from '../../../dto/customer/query/GetCustomerOrdersRequestDto';
import { toCustomerOrderResponseDto } from '../../../mapping/customer/customerMapper';

export class GetCustomerOrdersUseCase {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: unknown): Promise<CustomerOrderResponseDto[]> {
    // 1. Validate input
    const { customerId }: GetCustomerOrdersRequestDto = 
      getCustomerOrdersRequestSchema.parse(input);

    // 2. Business logic - verify customer exists (optional)
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // 3. Get data
    const orders = await this.customerRepo.findOrdersByCustomerId(customerId);

    // 4. Map to DTOs
    return orders.map(toCustomerOrderResponseDto);
  }
}
```

**Why?** Use cases contain business logic and orchestrate the flow. They:
- Validate input
- Execute business rules
- Coordinate repositories
- Return DTOs (not domain entities)

---

### Step 6: Interface Layer - Controller

**File: `src/interfaces/http/controller/customer/CustomerController.ts`**

```typescript
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { GetCustomerOrdersUseCase } from '../../../../application/use-case/customer/query/GetCustomerOrdersUseCase';

export class CustomerController {
  constructor(
    // ...existing use cases...
    private readonly getCustomerOrdersUseCase: GetCustomerOrdersUseCase
  ) {}

  // ...existing methods...

  /**
   * Get all orders for a customer
   * GET /api/customer/:customerId/orders
   */
  getOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.getCustomerOrdersUseCase.execute({
        customerId: req.params.customerId
      });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };
}
```

**Why?** Controllers are thin - they just:
- Extract data from HTTP request
- Call use case
- Return HTTP response
- Handle errors via middleware

---

### Step 7: Interface Layer - Route

**File: `src/interfaces/http/route/customer/customerRoute.ts`**

```typescript
export function createCustomerRouter(
  controller: CustomerController,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  // ...existing routes...

  /**
   * @openapi
   * /api/customer/{customerId}/orders:
   *   get:
   *     tags:
   *       - Customers
   *     summary: Get customer orders
   *     description: Retrieve all orders for a specific customer
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: customerId
   *         required: true
   *         schema:
   *           type: string
   *         description: Customer ID
   *     responses:
   *       200:
   *         description: List of customer orders
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   customerId:
   *                     type: string
   *                   orderDate:
   *                     type: string
   *                     format: date-time
   *                   total:
   *                     type: number
   *                   status:
   *                     type: string
   *       404:
   *         description: Customer not found
   *       401:
   *         description: Unauthorized
   */
  router.get('/:customerId/orders', auth, controller.getOrders);

  return router;
}
```

**Why?** Routes register endpoints and apply middleware (auth, validation, etc.).

---

### Step 8: Dependency Injection (Wire Everything Together)

**File: `src/container.ts`**

```typescript
export async function createApp() {
  // ...existing code...

  // Repositories
  const customerRepo = new PgCustomerRepository(pool);

  // Use Cases
  const getCustomerOrdersUseCase = new GetCustomerOrdersUseCase(customerRepo);

  // Controllers
  const customerController = new CustomerController(
    createCustomerUseCase,
    updateCustomerUseCase,
    deleteCustomerUseCase,
    findCustomerUseCase,
    getCustomerByIdUseCase,
    getCustomerOrdersUseCase // Add new use case
  );

  // App
  const app = createExpressApp(
    env,
    customerController,
    // ...other controllers
  );

  return app;
}
```

**Why?** Manual dependency injection:
- Makes dependencies explicit
- Enables testing with mocks
- Single place to configure entire app

---

## Complete Checklist for New Endpoint

### ☑️ Domain Layer
- [ ] Add method to repository interface (`CustomerRepository.ts`)
- [ ] Define domain entity if new (`Order.ts`)

### ☑️ Infrastructure Layer
- [ ] Create SQL file (`customer_orders_by_id.sql`)
- [ ] Implement repository method (`PgCustomerRepository.ts`)
- [ ] Add row mapping function
- [ ] Load SQL with `loadSql()`

### ☑️ Application Layer - DTOs
- [ ] Create input DTO with Zod schema (`GetCustomerOrdersRequestDto.ts`)
- [ ] Create output DTO (`CustomerOrderResponseDto.ts`)

### ☑️ Application Layer - Mapper
- [ ] Add mapper function (`toCustomerOrderResponseDto()`)

### ☑️ Application Layer - Use Case
- [ ] Create use case class (`GetCustomerOrdersUseCase.ts`)
- [ ] Validate input with Zod
- [ ] Implement business logic
- [ ] Return mapped DTOs

### ☑️ Interface Layer - Controller
- [ ] Add method to controller
- [ ] Extract request data
- [ ] Call use case
- [ ] Return response

### ☑️ Interface Layer - Route
- [ ] Add route with JSDoc Swagger documentation
- [ ] Apply middleware (auth, roles)
- [ ] Wire to controller method

### ☑️ Dependency Injection
- [ ] Instantiate use case in `container.ts`
- [ ] Inject into controller
- [ ] Pass controller to app

---

## Patterns by Endpoint Type

### Query Endpoint (Read Data)

**Example: GET /api/customer/:id**

```
Route → Controller → Query Use Case → Repository → Database
                                            ↓
                                      Map to DTO
                                            ↓
                                    Return to Client
```

**Characteristics:**
- Use case in `query/` folder
- No state changes
- Return DTOs
- Can apply filters, pagination
- Usually doesn't need Actor

### Command Endpoint (Write Data)

**Example: POST /api/customer**

```
Route → Controller → Command Use Case → Repository → Database
                          ↓
                  Business Rules
                  Validation
                  Domain Logic
                          ↓
                    Return DTO
```

**Characteristics:**
- Use case in `command/` folder
- Changes state (create/update/delete)
- Requires validation
- May need Actor for audit
- Returns created/updated DTO

### Command with Transaction

**Example: POST /api/pawn-ticket (creates ticket + items)**

```
Route → Controller → Command Use Case → Unit of Work
                                            ↓
                                  Begin Transaction
                                            ↓
                            Create Ticket → Repository
                                            ↓
                            Create Items → Repository
                                            ↓
                                   Commit Transaction
                                            ↓
                                      Return DTO
```

**Use:** `PawnTicketUnitOfWork` for atomic operations

---

## Folder Structure Pattern

```
src/
├── domains/
│   └── customer/
│       ├── Customer.ts              # Entity
│       ├── Order.ts                 # Entity
│       └── CustomerRepository.ts    # Interface
│
├── infrastructure/
│   ├── db/
│   │   └── sql/
│   │       └── queries/
│   │           └── customer/
│   │               └── customer_orders_by_id.sql
│   └── persistence/
│       └── customer/
│           └── PgCustomerRepository.ts  # Implementation
│
├── application/
│   ├── dto/
│   │   └── customer/
│   │       ├── command/
│   │       │   └── CreateCustomerRequestDto.ts
│   │       └── query/
│   │           ├── GetCustomerOrdersRequestDto.ts
│   │           └── CustomerOrderResponseDto.ts
│   │
│   ├── mapping/
│   │   └── customer/
│   │       └── customerMapper.ts
│   │
│   └── use-case/
│       └── customer/
│           ├── command/
│           │   └── CreateCustomerUseCase.ts
│           └── query/
│               └── GetCustomerOrdersUseCase.ts
│
└── interfaces/
    └── http/
        ├── controller/
        │   └── customer/
        │       └── CustomerController.ts
        └── route/
            └── customer/
                └── customerRoute.ts
```

---

## Naming Conventions

### Files
- **Entities:** `Customer.ts`, `Order.ts` (PascalCase, singular)
- **Repositories:** `CustomerRepository.ts` (PascalCase, singular)
- **Use Cases:** `GetCustomerOrdersUseCase.ts` (PascalCase, verb + noun)
- **DTOs:** `CustomerOrderResponseDto.ts` (PascalCase, descriptive)
- **Controllers:** `CustomerController.ts` (PascalCase, singular)
- **Routes:** `customerRoute.ts` (camelCase, singular)

### Classes/Interfaces
- **Use Cases:** `GetCustomerOrdersUseCase` (verb phrase)
- **Repositories:** `CustomerRepository` (noun + Repository)
- **Controllers:** `CustomerController` (noun + Controller)
- **DTOs:** Type aliases, not classes

### Methods
- **Repository:** `findById`, `findOrdersByCustomerId`, `create`, `update`, `delete`
- **Use Case:** `execute` (always)
- **Controller:** `getOrders`, `create`, `update`, `remove` (HTTP verb-like)

---

## Common Patterns

### Pattern 1: Simple Query (No Parameters)

**GET /api/categories**

```typescript
// Use Case
export class GetAllCategoriesUseCase {
  async execute(): Promise<CategoryDto[]> {
    const categories = await this.repo.findAll();
    return categories.map(toCategoryDto);
  }
}

// Controller
getAll = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await this.useCase.execute();
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
```

### Pattern 2: Query with Path Parameter

**GET /api/customer/:id**

```typescript
// Use Case
async execute(input: unknown): Promise<CustomerDto> {
  const { id } = getCustomerByIdRequestSchema.parse(input);
  const customer = await this.repo.findById(id);
  if (!customer) throw new NotFoundError('Customer not found');
  return toCustomerDto(customer);
}

// Controller
getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const result = await this.useCase.execute({ id: req.params.id });
  return res.json(result);
};
```

### Pattern 3: Query with Query Parameters

**GET /api/customer/search?lastName=Smith&firstName=John**

```typescript
// Controller
search = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { lastName, firstName } = req.query;
  const input = {
    lastName: typeof lastName === 'string' ? lastName : undefined,
    firstName: typeof firstName === 'string' ? firstName : undefined
  };
  const result = await this.useCase.execute(input);
  return res.json(result);
};
```

### Pattern 4: Create Command

**POST /api/customer**

```typescript
// Use Case
async execute(input: unknown): Promise<CustomerDto> {
  const dto = createCustomerRequestSchema.parse(input);
  
  const customer = new Customer({
    id: crypto.randomUUID(),
    firstName: dto.firstName,
    lastName: dto.lastName,
    // ...map all fields
  });
  
  const created = await this.repo.create(customer);
  return toCustomerDto(created);
}

// Controller
create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const result = await this.useCase.execute(req.body);
  return res.status(201).json(result);
};
```

### Pattern 5: Update Command

**PUT /api/customer/:id**

```typescript
// Use Case
async execute(input: unknown): Promise<CustomerDto> {
  const dto = updateCustomerRequestSchema.parse(input);
  
  const existing = await this.repo.findById(dto.id);
  if (!existing) throw new NotFoundError('Customer not found');
  
  // Update fields
  existing.firstName = dto.firstName;
  existing.lastName = dto.lastName;
  // ...
  
  const updated = await this.repo.update(existing);
  return toCustomerDto(updated);
}

// Controller
update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const payload = { ...req.body, id: req.params.id };
  const result = await this.useCase.execute(payload);
  return res.json(result);
};
```

### Pattern 6: Delete Command (with Role Check)

**DELETE /api/customer/:id**

```typescript
// Use Case
async execute(actor: Actor, customerId: string): Promise<void> {
  const customer = await this.repo.findById(customerId);
  if (!customer) throw new NotFoundError('Customer not found');
  
  await this.repo.delete(customerId);
}

// Controller
remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const actor = this.getActor(req);
  await this.useCase.execute(actor, req.params.id);
  return res.status(204).send();
};

// Route
router.delete('/:id', auth, requireRole(['admin', 'manager']), controller.remove);
```

---

## Testing Patterns

### Unit Testing Use Cases

```typescript
describe('GetCustomerOrdersUseCase', () => {
  let useCase: GetCustomerOrdersUseCase;
  let mockRepo: jest.Mocked<CustomerRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findOrdersByCustomerId: jest.fn()
    } as any;
    
    useCase = new GetCustomerOrdersUseCase(mockRepo);
  });

  it('should return customer orders', async () => {
    const customerId = 'customer-123';
    const orders = [/* mock orders */];
    
    mockRepo.findById.mockResolvedValue({ id: customerId } as Customer);
    mockRepo.findOrdersByCustomerId.mockResolvedValue(orders);

    const result = await useCase.execute({ customerId });

    expect(result).toHaveLength(orders.length);
    expect(mockRepo.findOrdersByCustomerId).toHaveBeenCalledWith(customerId);
  });

  it('should throw NotFoundError if customer not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'invalid' }))
      .rejects.toThrow(NotFoundError);
  });
});
```

---

## Best Practices

### ✅ DO
- Keep controllers thin (just HTTP handling)
- Put business logic in use cases
- Validate input with Zod in use cases
- Use DTOs for API contracts
- Keep SQL in separate `.sql` files
- Return DTOs from use cases (not entities)
- Use explicit dependency injection
- Add Swagger documentation to routes
- Use meaningful error messages

### ❌ DON'T
- Put business logic in controllers
- Access database directly from controllers
- Return domain entities from controllers
- Mix layers (skip layers)
- Put SQL in repository code
- Use `any` types
- Forget error handling
- Skip input validation

---

## Quick Reference Commands

```bash
# Create new folders
mkdir -p src/application/dto/resource/query
mkdir -p src/application/dto/resource/command
mkdir -p src/application/use-case/resource/query
mkdir -p src/application/use-case/resource/command

# Build and run
npm run build
npm run dev

# Test
npm test

# Check Swagger
# http://localhost:3001/api-docs
```

---

## Summary

**Creating a new endpoint involves 8 steps across 4 layers:**

1. **Domain** - Define interface
2. **Infrastructure** - Implement data access
3. **Application (DTO)** - Define input/output contracts
4. **Application (Mapper)** - Convert entities ↔ DTOs
5. **Application (Use Case)** - Implement business logic
6. **Interface (Controller)** - Handle HTTP
7. **Interface (Route)** - Register endpoint
8. **Container** - Wire dependencies

**Remember:** Each layer has a specific responsibility. Don't skip layers or mix concerns!

---

For more details, see:
- [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md) - API documentation
- [SWAGGER_QUICKREF.md](./SWAGGER_QUICKREF.md) - Quick reference
