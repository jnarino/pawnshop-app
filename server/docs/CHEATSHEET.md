# Endpoint Creation Cheat Sheet

## Quick Start: New Endpoint Template

Copy and modify this template for any new endpoint:

---

## 1. Domain Layer

### `src/domains/{resource}/{Resource}Repository.ts`
```typescript
export interface {Resource}Repository {
  findById(id: string): Promise<{Resource} | null>;
  create(entity: {Resource}): Promise<{Resource}>;
  update(entity: {Resource}): Promise<{Resource}>;
  delete(id: string): Promise<void>;
}
```

---

## 2. Infrastructure Layer

### `src/infrastructure/db/sql/queries/{resource}/{resource}_find_by_id.sql`
```sql
SELECT * FROM {table_name}
WHERE id = $1;
```

### `src/infrastructure/persistence/{resource}/Pg{Resource}Repository.ts`
```typescript
import { Pool } from 'pg';
import { {Resource} } from '../../../domains/{resource}/{Resource}';
import { {Resource}Repository } from '../../../domains/{resource}/{Resource}Repository';
import { loadSql } from '../../db/sqlLoader';

const sqlFindById = loadSql('queries', '{resource}/{resource}_find_by_id');

export class Pg{Resource}Repository implements {Resource}Repository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<{Resource} | null> {
    const result = await this.pool.query(sqlFindById, [id]);
    if (result.rowCount === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: any): {Resource} {
    return new {Resource}({
      id: row.id,
      // ...map all fields
    });
  }
}
```

---

## 3. Application Layer - DTOs

### `src/application/dto/{resource}/query/Get{Resource}ByIdRequestDto.ts`
```typescript
import { z } from 'zod';

export const get{Resource}ByIdRequestSchema = z.object({
  id: z.string().uuid()
});

export type Get{Resource}ByIdRequestDto = z.infer<typeof get{Resource}ByIdRequestSchema>;
```

### `src/application/dto/{resource}/query/{Resource}ResponseDto.ts`
```typescript
export type {Resource}ResponseDto = {
  id: string;
  name: string;
  // ...all fields
  createdAt: string;
  updatedAt: string;
};
```

---

## 4. Application Layer - Mapper

### `src/application/mapping/{resource}/{resource}Mapper.ts`
```typescript
import { {Resource} } from '../../../domains/{resource}/{Resource}';
import { {Resource}ResponseDto } from '../../dto/{resource}/query/{Resource}ResponseDto';

export function to{Resource}ResponseDto(entity: {Resource}): {Resource}ResponseDto {
  return {
    id: entity.id,
    name: entity.name,
    // ...map all fields
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString()
  };
}
```

---

## 5. Application Layer - Use Case

### Query: `src/application/use-case/{resource}/query/Get{Resource}ByIdUseCase.ts`
```typescript
import { {Resource}Repository } from '../../../../domains/{resource}/{Resource}Repository';
import { NotFoundError } from '../../../common/errors';
import { {Resource}ResponseDto } from '../../../dto/{resource}/query/{Resource}ResponseDto';
import { 
  Get{Resource}ByIdRequestDto, 
  get{Resource}ByIdRequestSchema 
} from '../../../dto/{resource}/query/Get{Resource}ByIdRequestDto';
import { to{Resource}ResponseDto } from '../../../mapping/{resource}/{resource}Mapper';

export class Get{Resource}ByIdUseCase {
  constructor(private readonly repo: {Resource}Repository) {}

  async execute(input: unknown): Promise<{Resource}ResponseDto> {
    const { id }: Get{Resource}ByIdRequestDto = 
      get{Resource}ByIdRequestSchema.parse(input);

    const entity = await this.repo.findById(id);
    if (!entity) {
      throw new NotFoundError('{Resource} not found');
    }

    return to{Resource}ResponseDto(entity);
  }
}
```

### Command: `src/application/use-case/{resource}/command/Create{Resource}UseCase.ts`
```typescript
import crypto from 'crypto';
import { {Resource} } from '../../../../domains/{resource}/{Resource}';
import { {Resource}Repository } from '../../../../domains/{resource}/{Resource}Repository';
import { 
  Create{Resource}RequestDto, 
  create{Resource}RequestSchema 
} from '../../../dto/{resource}/command/Create{Resource}RequestDto';
import { {Resource}ResponseDto } from '../../../dto/{resource}/query/{Resource}ResponseDto';
import { to{Resource}ResponseDto } from '../../../mapping/{resource}/{resource}Mapper';

export class Create{Resource}UseCase {
  constructor(private readonly repo: {Resource}Repository) {}

  async execute(input: unknown): Promise<{Resource}ResponseDto> {
    const dto: Create{Resource}RequestDto = 
      create{Resource}RequestSchema.parse(input);

    const entity = new {Resource}({
      id: crypto.randomUUID(),
      name: dto.name,
      // ...map all fields
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const created = await this.repo.create(entity);
    return to{Resource}ResponseDto(created);
  }
}
```

---

## 6. Interface Layer - Controller

### `src/interfaces/http/controller/{resource}/{Resource}Controller.ts`
```typescript
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { Get{Resource}ByIdUseCase } from '../../../../application/use-case/{resource}/query/Get{Resource}ByIdUseCase';
import { Create{Resource}UseCase } from '../../../../application/use-case/{resource}/command/Create{Resource}UseCase';

export class {Resource}Controller {
  constructor(
    private readonly get{Resource}ByIdUseCase: Get{Resource}ByIdUseCase,
    private readonly create{Resource}UseCase: Create{Resource}UseCase
  ) {}

  /**
   * GET /api/{resource}/:id
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.get{Resource}ByIdUseCase.execute({ 
        id: req.params.id 
      });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * POST /api/{resource}
   */
  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.create{Resource}UseCase.execute(req.body);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  };
}
```

---

## 7. Interface Layer - Route

### `src/interfaces/http/route/{resource}/{resource}Route.ts`
```typescript
import { Router } from 'express';
import { {Resource}Controller } from '../../controller/{resource}/{Resource}Controller';
import { authenticate } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/roleMiddleware';

export function create{Resource}Router(
  controller: {Resource}Controller,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);

  /**
   * @openapi
   * /api/{resource}/{id}:
   *   get:
   *     tags:
   *       - {Resource}s
   *     summary: Get {resource} by ID
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
   *         description: {Resource} details
   *       404:
   *         description: Not found
   *       401:
   *         description: Unauthorized
   */
  router.get('/:id', auth, controller.getById);

  /**
   * @openapi
   * /api/{resource}:
   *   post:
   *     tags:
   *       - {Resource}s
   *     summary: Create {resource}
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       201:
   *         description: Created
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Unauthorized
   */
  router.post('/', auth, controller.create);

  return router;
}
```

---

## 8. Dependency Injection - Container

### `src/container.ts`
```typescript
export async function createApp() {
  // ...existing code...

  // Repository
  const {resource}Repo = new Pg{Resource}Repository(pool);

  // Use Cases
  const get{Resource}ByIdUseCase = new Get{Resource}ByIdUseCase({resource}Repo);
  const create{Resource}UseCase = new Create{Resource}UseCase({resource}Repo);

  // Controller
  const {resource}Controller = new {Resource}Controller(
    get{Resource}ByIdUseCase,
    create{Resource}UseCase
  );

  // Router
  const {resource}Router = create{Resource}Router({resource}Controller, env.jwtSecret);

  // App
  const app = createExpressApp(
    env,
    // ...existing controllers
    {resource}Controller
  );

  // Register routes in app
  app.use('/api/{resource}', {resource}Router);

  return app;
}
```

---

## Common Query Patterns

### List All (No parameters)
```typescript
// Use Case
async execute(): Promise<{Resource}ResponseDto[]> {
  const entities = await this.repo.findAll();
  return entities.map(to{Resource}ResponseDto);
}

// Controller
getAll = async (_req, res, next) => {
  const result = await this.useCase.execute();
  return res.json(result);
};

// Route
router.get('/', auth, controller.getAll);
```

### Get by ID (Path parameter)
```typescript
// Controller
getById = async (req, res, next) => {
  const result = await this.useCase.execute({ id: req.params.id });
  return res.json(result);
};

// Route
router.get('/:id', auth, controller.getById);
```

### Search (Query parameters)
```typescript
// Controller
search = async (req, res, next) => {
  const { q, status } = req.query;
  const result = await this.useCase.execute({ 
    query: q as string, 
    status: status as string 
  });
  return res.json(result);
};

// Route
router.get('/search', auth, controller.search);
```

### Get related resources
```typescript
// Controller
getRelated = async (req, res, next) => {
  const result = await this.useCase.execute({ 
    parentId: req.params.parentId 
  });
  return res.json(result);
};

// Route
router.get('/:parentId/children', auth, controller.getRelated);
```

---

## Common Command Patterns

### Create (POST)
```typescript
// Controller
create = async (req, res, next) => {
  const result = await this.useCase.execute(req.body);
  return res.status(201).json(result);
};

// Route
router.post('/', auth, controller.create);
```

### Update (PUT)
```typescript
// Controller
update = async (req, res, next) => {
  const payload = { ...req.body, id: req.params.id };
  const result = await this.useCase.execute(payload);
  return res.json(result);
};

// Route
router.put('/:id', auth, controller.update);
```

### Delete (DELETE) - Admin only
```typescript
// Controller
remove = async (req, res, next) => {
  await this.useCase.execute(req.params.id);
  return res.status(204).send();
};

// Route
router.delete('/:id', auth, requireRole(['admin', 'manager']), controller.remove);
```

---

## File Naming Conventions

```
{Resource}                    # PascalCase, singular
{Resource}Repository          # Interface name
Pg{Resource}Repository        # Implementation name
{Resource}Controller          # Controller name
{resource}Route               # camelCase, singular
{Resource}ResponseDto         # PascalCase
Get{Resource}ByIdUseCase      # Verb + Resource + UseCase
Create{Resource}UseCase       # Verb + Resource + UseCase
{resource}_find_by_id.sql     # snake_case
```

---

## SQL File Locations

```
queries/              # SELECT statements
  {resource}/
    {resource}_find_by_id.sql
    {resource}_find_all.sql
    {resource}_search.sql

commands/             # INSERT, UPDATE, DELETE
  {resource}/
    {resource}_create.sql
    {resource}_update.sql
    {resource}_delete.sql
```

---

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `Cannot find module` | Check imports and file paths |
| `Type 'unknown' is not assignable` | Add Zod schema validation |
| `Repository method not found` | Add method to interface first |
| `SQL file not found` | Check path in `loadSql()` |
| `Zod validation error` | Check DTO schema matches input |
| `404 Not found` | Check route registration in app |

---

## Testing Template

```typescript
import { Get{Resource}ByIdUseCase } from './Get{Resource}ByIdUseCase';
import { {Resource}Repository } from '../../../../domains/{resource}/{Resource}Repository';

describe('Get{Resource}ByIdUseCase', () => {
  let useCase: Get{Resource}ByIdUseCase;
  let mockRepo: jest.Mocked<{Resource}Repository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn()
    } as any;
    
    useCase = new Get{Resource}ByIdUseCase(mockRepo);
  });

  it('should return {resource} when found', async () => {
    const mock{Resource} = { id: '123', name: 'Test' };
    mockRepo.findById.mockResolvedValue(mock{Resource} as any);

    const result = await useCase.execute({ id: '123' });

    expect(result.id).toBe('123');
    expect(mockRepo.findById).toHaveBeenCalledWith('123');
  });

  it('should throw NotFoundError when not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: '999' }))
      .rejects.toThrow('not found');
  });
});
```

---

## Quick Commands

```bash
# Build
npm run build

# Run dev
npm run dev

# Test
npm test

# View Swagger
open http://localhost:3001/api-docs
```

---


## Control Number Initialization (Pawn, Purchase, Store Sale)

**Pawn:**
  - Key: `pawn_ticket_control_number_next`
  - Use: `get_next_pawn_control_number()`

**Purchase:**
  - Key: `purchase_ticket_control_number_next`
  - Use: `get_next_purchase_control_number()`

**Store Sale (Retail/Layaway):**
  - Key: `store_sale_control_number_next`
  - Use: `get_next_store_sale_control_number()`
  - To initialize from legacy data:
    1. Run:
       ```sql
       SELECT MAX(acct.TICKETNUM) FROM acct WHERE acct.TYPE IN ('SL','SLD','SLP','SLU','SS','SSV','SLV');
       ```
    2. Set value:
       ```sql
       UPDATE app_settings SET value = '<max+1>' WHERE key = 'store_sale_control_number_next';
       ```

---

## Checklist

- [ ] Domain: Add repository interface method
- [ ] Infrastructure: Create SQL file
- [ ] Infrastructure: Implement repository method
- [ ] Application: Create request DTO with Zod
- [ ] Application: Create response DTO
- [ ] Application: Add mapper function
- [ ] Application: Create use case
- [ ] Interface: Add controller method
- [ ] Interface: Add route with Swagger docs
- [ ] Container: Wire dependencies
- [ ] Test in Swagger UI

---

**🎯 Pro Tip:** Start by copying an existing endpoint that's similar to what you need, then modify it. This is faster and ensures consistency!
