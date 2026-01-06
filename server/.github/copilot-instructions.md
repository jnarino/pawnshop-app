# GitHub Copilot Instructions for Pawnshop API

## Project Architecture

This project follows **Clean Architecture / Domain-Driven Design (DDD)** with strict layer separation:

```
Domain Layer (innermost)
    ↑
Infrastructure Layer (implements domain interfaces)
    ↑
Application Layer (business logic, DTOs, use cases)
    ↑
Interface Layer (HTTP, controllers, routes)
```

**Critical Rule:** Dependencies flow INWARD. Outer layers depend on inner layers, never the reverse.

---

## Complete Documentation

Before generating code, refer to:
- `docs/ARCHITECTURE.md` - Architecture patterns and flow
- `docs/ENDPOINT_CREATION_GUIDE.md` - Complete step-by-step guide
- `docs/CHEATSHEET.md` - Quick templates for all layers

---

## Layer Structure & Responsibilities

### 1. Domain Layer (`src/domains/{resource}/`)

**Purpose:** Define business entities and repository contracts

**Files to create:**
- `{Resource}.ts` - Entity class
- `{Resource}Repository.ts` - Repository interface

**Example:**
```typescript
// src/domains/customer/Customer.ts
export class Customer {
  readonly id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  // ... other fields
  
  constructor(props: CustomerProps) {
    this.id = props.id;
    this.firstName = props.firstName;
    // ... assign all fields
  }
}

// src/domains/customer/CustomerRepository.ts
export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  create(customer: Customer): Promise<Customer>;
  update(customer: Customer): Promise<Customer>;
  delete(id: string): Promise<void>;
  findByCriteria(criteria: FindCustomerCriteria): Promise<Customer[]>;
}
```

**Rules:**
- ✅ Pure business logic only
- ✅ No dependencies on other layers
- ✅ Use class for entities
- ✅ Use interface for repositories
- ❌ No DTOs, no HTTP, no database details

---

### 2. Infrastructure Layer (`src/infrastructure/`)

**Purpose:** Implement data access and external services

**Files to create:**
- `infrastructure/db/sql/queries/{resource}/{resource}_operation.sql` - SQL queries
- `infrastructure/db/sql/commands/{resource}/{resource}_operation.sql` - SQL commands
- `infrastructure/persistence/{resource}/Pg{Resource}Repository.ts` - Implementation

**Example:**
```typescript
// src/infrastructure/persistence/customer/PgCustomerRepository.ts
import { Pool } from 'pg';
import { Customer } from '../../../domains/customer/Customer';
import { CustomerRepository } from '../../../domains/customer/CustomerRepository';
import { loadSql } from '../../db/sqlLoader';

const sqlFindById = loadSql('queries', 'customer/customer_find_by_id');
const sqlCreate = loadSql('commands', 'customer/customer_create');

export class PgCustomerRepository implements CustomerRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Customer | null> {
    const result = await this.pool.query(sqlFindById, [id]);
    if (result.rowCount === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async create(customer: Customer): Promise<Customer> {
    const result = await this.pool.query(sqlCreate, [
      customer.firstName,
      customer.lastName,
      customer.phoneNumber,
      // ... all fields
    ]);
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: any): Customer {
    return new Customer({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phoneNumber: row.phone_number,
      // ... map all fields from snake_case to camelCase
    });
  }
}
```

**SQL File Example:**
```sql
-- src/infrastructure/db/sql/queries/customer/customer_find_by_id.sql
SELECT 
  c.id,
  c.first_name,
  c.last_name,
  c.phone_number
FROM customer c
WHERE c.id = $1;
```

**Rules:**
- ✅ Load SQL from separate .sql files using `loadSql()`
- ✅ Implement domain repository interfaces
- ✅ Map database rows to domain entities
- ✅ Use snake_case in SQL, camelCase in TypeScript
- ❌ No business logic in repositories

---

### 3. Application Layer (`src/application/`)

**Purpose:** Business logic orchestration, validation, and data transformation

#### 3a. DTOs (`src/application/dto/{resource}/`)

**Structure:**
- `command/` - For write operations (POST, PUT, DELETE)
- `query/` - For read operations (GET)

**Example:**
```typescript
// src/application/dto/customer/query/GetCustomerByIdRequestDto.ts
import { z } from 'zod';

export const getCustomerByIdRequestSchema = z.object({
  id: z.string().uuid()
});

export type GetCustomerByIdRequestDto = z.infer<typeof getCustomerByIdRequestSchema>;

// src/application/dto/customer/query/CustomerResponseDto.ts
export type CustomerResponseDto = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  createdAt: string; // ISO format
  updatedAt: string;
};

// src/application/dto/customer/command/CreateCustomerRequestDto.ts
export const createCustomerRequestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().optional()
});

export type CreateCustomerRequestDto = z.infer<typeof createCustomerRequestSchema>;
```

**Rules:**
- ✅ Always use Zod for input validation
- ✅ Export both schema and type
- ✅ Use type aliases (not classes) for DTOs
- ✅ Convert Date to string (ISO format)
- ❌ No domain entities in DTOs

#### 3b. Mappers (`src/application/mapping/{resource}/`)

**Example:**
```typescript
// src/application/mapping/customer/customerMapper.ts
import { Customer } from '../../../domains/customer/Customer';
import { CustomerResponseDto } from '../../dto/customer/query/CustomerResponseDto';

export function toCustomerResponseDto(customer: Customer): CustomerResponseDto {
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phoneNumber: customer.phoneNumber,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString()
  };
}
```

**Rules:**
- ✅ Keep mappers pure functions
- ✅ Convert Date to ISO string
- ✅ Handle null/undefined properly
- ✅ One file per resource

#### 3c. Use Cases (`src/application/use-case/{resource}/`)

**Structure:**
- `query/` - Read operations (GET)
- `command/` - Write operations (POST, PUT, DELETE)

**Query Use Case Example:**
```typescript
// src/application/use-case/customer/query/GetCustomerByIdUseCase.ts
import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import { NotFoundError } from '../../../common/errors';
import { CustomerResponseDto } from '../../../dto/customer/query/CustomerResponseDto';
import { 
  GetCustomerByIdRequestDto, 
  getCustomerByIdRequestSchema 
} from '../../../dto/customer/query/GetCustomerByIdRequestDto';
import { toCustomerResponseDto } from '../../../mapping/customer/customerMapper';

export class GetCustomerByIdUseCase {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: unknown): Promise<CustomerResponseDto> {
    // 1. Validate input
    const { id }: GetCustomerByIdRequestDto = 
      getCustomerByIdRequestSchema.parse(input);

    // 2. Get entity
    const customer = await this.customerRepo.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // 3. Map to DTO
    return toCustomerResponseDto(customer);
  }
}
```

**Command Use Case Example:**
```typescript
// src/application/use-case/customer/command/CreateCustomerUseCase.ts
import crypto from 'crypto';
import { Customer } from '../../../../domains/customer/Customer';
import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import { 
  CreateCustomerRequestDto, 
  createCustomerRequestSchema 
} from '../../../dto/customer/command/CreateCustomerRequestDto';
import { CustomerResponseDto } from '../../../dto/customer/query/CustomerResponseDto';
import { toCustomerResponseDto } from '../../../mapping/customer/customerMapper';

export class CreateCustomerUseCase {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: unknown): Promise<CustomerResponseDto> {
    // 1. Validate
    const dto: CreateCustomerRequestDto = 
      createCustomerRequestSchema.parse(input);

    // 2. Create entity
    const customer = new Customer({
      id: crypto.randomUUID(),
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 3. Persist
    const created = await this.customerRepo.create(customer);

    // 4. Return DTO
    return toCustomerResponseDto(created);
  }
}
```

**Rules:**
- ✅ Always validate input with Zod
- ✅ Use `execute()` as the only public method
- ✅ Accept `unknown` input type
- ✅ Return DTOs, never entities
- ✅ Throw domain errors (NotFoundError, ValidationError)
- ❌ No HTTP knowledge in use cases

---

### 4. Interface Layer (`src/interfaces/http/`)

#### 4a. Controllers (`src/interfaces/http/controller/{resource}/`)

**Example:**
```typescript
// src/interfaces/http/controller/customer/CustomerController.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { GetCustomerByIdUseCase } from '../../../../application/use-case/customer/query/GetCustomerByIdUseCase';
import { CreateCustomerUseCase } from '../../../../application/use-case/customer/command/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from '../../../../application/use-case/customer/command/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from '../../../../application/use-case/customer/command/DeleteCustomerUseCase';

export class CustomerController {
  constructor(
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase
  ) {}

  /**
   * GET /api/customer/:id
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.getCustomerByIdUseCase.execute({ 
        id: req.params.id 
      });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * POST /api/customer
   */
  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.createCustomerUseCase.execute(req.body);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * PUT /api/customer/:id
   */
  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = { ...req.body, id: req.params.id };
      const result = await this.updateCustomerUseCase.execute(payload);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * DELETE /api/customer/:id
   */
  remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await this.deleteCustomerUseCase.execute(req.params.id);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  };
}
```

**Rules:**
- ✅ Keep controllers thin (no business logic)
- ✅ Extract data from HTTP request
- ✅ Call use case
- ✅ Return HTTP response
- ✅ Pass errors to `next(err)` for middleware handling
- ✅ Use arrow functions for methods
- ❌ No validation in controllers (use cases handle this)

#### 4b. Routes (`src/interfaces/http/route/{resource}/`)

**Example:**
```typescript
// src/interfaces/http/route/customer/customerRoute.ts
import { Router } from 'express';
import { CustomerController } from '../../controller/customer/CustomerController';
import { authenticate } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/roleMiddleware';

export function createCustomerRouter(
  controller: CustomerController,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  /**
   * @openapi
   * /api/customer/{id}:
   *   get:
   *     tags:
   *       - Customers
   *     summary: Get customer by ID
   *     description: Retrieve full customer details by ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Customer ID
   *     responses:
   *       200:
   *         description: Customer details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Customer'
   *       404:
   *         description: Customer not found
   *       401:
   *         description: Unauthorized
   */
  router.get('/:id', auth, controller.getById);

  /**
   * @openapi
   * /api/customer:
   *   post:
   *     tags:
   *       - Customers
   *     summary: Create new customer
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Customer'
   *     responses:
   *       201:
   *         description: Customer created successfully
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Unauthorized
   */
  router.post('/', auth, controller.create);

  /**
   * @openapi
   * /api/customer/{id}:
   *   put:
   *     tags:
   *       - Customers
   *     summary: Update customer
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Customer'
   *     responses:
   *       200:
   *         description: Customer updated successfully
   *       404:
   *         description: Customer not found
   *       401:
   *         description: Unauthorized
   */
  router.put('/:id', auth, controller.update);

  /**
   * @openapi
   * /api/customer/{id}:
   *   delete:
   *     tags:
   *       - Customers
   *     summary: Delete customer
   *     description: Delete a customer (requires admin or manager role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Customer deleted successfully
   *       404:
   *         description: Customer not found
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  router.delete('/:id', auth, requireRole(['admin', 'manager']), controller.remove);

  return router;
}
```

**Rules:**
- ✅ Add `@openapi` JSDoc for Swagger documentation
- ✅ Apply `authenticate()` middleware for protected routes
- ✅ Use `requireRole()` for role-based access control
- ✅ Export factory function that takes controller and jwtSecret
- ✅ Use full API paths in Swagger docs (e.g., `/api/customer/{id}`)

---

### 5. Dependency Injection (`src/container.ts`)

**Example:**
```typescript
// src/container.ts
export async function createApp() {
  await runMigrations();

  // 1. Repositories (Infrastructure)
  const customerRepo = new PgCustomerRepository(pool);

  // 2. Use Cases (Application)
  const getCustomerByIdUseCase = new GetCustomerByIdUseCase(customerRepo);
  const createCustomerUseCase = new CreateCustomerUseCase(customerRepo);
  const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepo);
  const deleteCustomerUseCase = new DeleteCustomerUseCase(customerRepo);

  // 3. Controllers (Interface)
  const customerController = new CustomerController(
    getCustomerByIdUseCase,
    createCustomerUseCase,
    updateCustomerUseCase,
    deleteCustomerUseCase
  );

  // 4. Create app with all controllers
  const app = createExpressApp(
    env,
    authController,
    appUserController,
    customerController,
    // ... other controllers
  );

  return app;
}
```

**Rules:**
- ✅ Wire dependencies manually (no DI framework)
- ✅ Order: Repositories → Use Cases → Controllers → App
- ✅ Pass all dependencies via constructor

---

## Naming Conventions

### Files
- **Entities:** `Customer.ts` (PascalCase, singular)
- **Repositories:** `CustomerRepository.ts` (interface), `PgCustomerRepository.ts` (implementation)
- **Use Cases:** `GetCustomerByIdUseCase.ts` (Verb + Noun + UseCase)
- **DTOs:** `CustomerResponseDto.ts`, `CreateCustomerRequestDto.ts`
- **Controllers:** `CustomerController.ts`
- **Routes:** `customerRoute.ts` (camelCase)
- **Mappers:** `customerMapper.ts`
- **SQL Files:** `customer_find_by_id.sql` (snake_case)

### Classes/Interfaces
- **Use Cases:** `GetCustomerByIdUseCase` (verb phrase ending in UseCase)
- **Repositories:** `CustomerRepository` (noun + Repository)
- **Controllers:** `CustomerController` (noun + Controller)

### Methods
- **Repository:** `findById`, `create`, `update`, `delete`, `findByCriteria`
- **Use Case:** Always `execute(input: unknown)`
- **Controller:** `getById`, `create`, `update`, `remove` (HTTP verb-like)

### Folders
- Use singular form: `customer/`, not `customers/`
- Group by resource, not by type

---

## Common Patterns

### Query Endpoint (GET)
```typescript
// 1. Route
router.get('/:id', auth, controller.getById);

// 2. Controller
getById = async (req, res, next) => {
  try {
    const result = await this.useCase.execute({ id: req.params.id });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

// 3. Use Case
async execute(input: unknown): Promise<ResponseDto> {
  const { id } = requestSchema.parse(input);
  const entity = await this.repo.findById(id);
  if (!entity) throw new NotFoundError('Not found');
  return toResponseDto(entity);
}
```

### Command Endpoint (POST)
```typescript
// 1. Route
router.post('/', auth, controller.create);

// 2. Controller
create = async (req, res, next) => {
  try {
    const result = await this.useCase.execute(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

// 3. Use Case
async execute(input: unknown): Promise<ResponseDto> {
  const dto = requestSchema.parse(input);
  const entity = new Entity({ id: crypto.randomUUID(), ...dto });
  const created = await this.repo.create(entity);
  return toResponseDto(created);
}
```

### Update Endpoint (PUT)
```typescript
// Controller merges id from params with body
update = async (req, res, next) => {
  try {
    const payload = { ...req.body, id: req.params.id };
    const result = await this.useCase.execute(payload);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
```

### Delete Endpoint (DELETE) with Role Check
```typescript
// Route applies role middleware
router.delete('/:id', auth, requireRole(['admin', 'manager']), controller.remove);

// Controller returns 204 No Content
remove = async (req, res, next) => {
  try {
    await this.useCase.execute(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
```

---

## Error Handling

Use custom error classes from `src/application/common/errors.ts`:
- `NotFoundError` → 404
- `ValidationError` (from Zod) → 400
- `UnauthorizedError` → 401
- `ForbiddenError` → 403

Controllers pass all errors to `next(err)` for centralized error handling middleware.

---

## Transaction Handling

For operations affecting multiple repositories, use Unit of Work:

```typescript
// Use Case
constructor(private readonly unitOfWork: PawnTicketUnitOfWork) {}

async execute(input: unknown): Promise<PawnTicketDto> {
  const dto = schema.parse(input);
  
  return await this.unitOfWork.withTransaction(async (txRepos) => {
    const ticket = await txRepos.pawnTicket.create(pawnTicket);
    
    for (const item of items) {
      await txRepos.inventoryItem.create(item);
    }
    
    return toPawnTicketDto(ticket);
  });
}
```

---

## Testing

### Unit Test Use Cases
```typescript
describe('GetCustomerByIdUseCase', () => {
  let useCase: GetCustomerByIdUseCase;
  let mockRepo: jest.Mocked<CustomerRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn()
    } as any;
    
    useCase = new GetCustomerByIdUseCase(mockRepo);
  });

  it('should return customer when found', async () => {
    const mockCustomer = { id: '123', firstName: 'John' };
    mockRepo.findById.mockResolvedValue(mockCustomer as any);

    const result = await useCase.execute({ id: '123' });

    expect(result.id).toBe('123');
    expect(mockRepo.findById).toHaveBeenCalledWith('123');
  });

  it('should throw NotFoundError when not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: '999' }))
      .rejects.toThrow(NotFoundError);
  });
});
```

- When you add a new service/use case, also add a unit test under `tests/unit/application/use-case/...` that covers the happy path and validation failures.

---

## Checklist for New Endpoint

When creating a new endpoint, follow this order:

1. ☑️ **Domain:** Add method to repository interface
2. ☑️ **Infrastructure:** Create SQL file in `sql/queries/` or `sql/commands/`
3. ☑️ **Infrastructure:** Implement repository method using `loadSql()`
4. ☑️ **Application:** Create request DTO with Zod schema
5. ☑️ **Application:** Create response DTO
6. ☑️ **Application:** Add mapper function (entity → DTO)
7. ☑️ **Application:** Create use case with `execute()` method
8. ☑️ **Interface:** Add controller method (thin wrapper)
9. ☑️ **Interface:** Add route with Swagger `@openapi` JSDoc
10. ☑️ **Container:** Wire dependencies (repo → use case → controller)

---

## Important Don'ts

❌ Don't put business logic in controllers
❌ Don't access database from controllers or use cases directly
❌ Don't return domain entities from controllers (use DTOs)
❌ Don't skip Zod validation in use cases
❌ Don't put SQL in repository implementations (use `.sql` files)
❌ Don't mix layers (e.g., domain depending on application)
❌ Don't use `any` type
❌ Don't forget error handling with `try/catch`

---

## Quick Reference

### Create GET endpoint
1. Add `findById()` to repository interface
2. Create `resource_find_by_id.sql`
3. Implement in `PgResourceRepository`
4. Create `GetResourceByIdRequestDto` with Zod
5. Create `ResourceResponseDto`
6. Add `toResourceResponseDto()` mapper
7. Create `GetResourceByIdUseCase`
8. Add `getById` method to controller
9. Add `router.get('/:id', auth, controller.getById)`
10. Wire in `container.ts`

### Create POST endpoint
Same as above, but:
- Use `command/` folder for DTOs
- Create `CreateResourceRequestDto` with Zod validation
- Create `CreateResourceUseCase`
- Use `router.post('/', auth, controller.create)`
- Return `201` status code

---

## Swagger Documentation

Always add JSDoc comments above routes:

```typescript
/**
 * @openapi
 * /api/resource/{id}:
 *   get:
 *     tags:
 *       - Resources
 *     summary: Get resource by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 */
```

See `docs/SWAGGER_GUIDE.md` for complete documentation patterns.

---

## Summary

When generating code for this project:

1. **Follow the layer architecture strictly**
2. **Start from the inside (Domain) and work outward (Interface)**
3. **Use the patterns shown in existing code** (customer, inventory, pawnTicket modules)
4. **Always validate with Zod in use cases**
5. **Keep SQL in separate .sql files**
6. **Return DTOs, not entities**
7. **Add Swagger documentation to routes**
8. **Wire dependencies in container.ts**

For complete examples and patterns, always refer to:
- `docs/CHEATSHEET.md` - Quick copy-paste templates
- `docs/ENDPOINT_CREATION_GUIDE.md` - Step-by-step walkthrough
- Existing code in `customer`, `inventory`, or `pawnTicket` modules
