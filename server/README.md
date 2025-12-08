Pawnshop Auth Server (DDD/CQRS-style)
=====================================

This project is a self-contained Node/TypeScript Express server that follows
a DDD-ish structure with use-case + DTO separation and a container.ts:

src/
  config/           -> env config
  domains/          -> Domain entities + repository interfaces
  infrastructure/   -> DB, logger, Pg repositories, migrations, SQL files
  application/
    common/         -> shared errors, Actor type
    dto/            -> DTOs + Zod schemas
    mapping/        -> entity -> DTO mappers
    service/        -> AuthService (JWT + sessions logic)
    use-case/       -> Use cases (auth, appUser)
  interfaces/
    http/
      middleware/   -> auth, role, error middlewares
      controller/   -> AuthController, AppUserController
      route/        -> Express routers
      createExpressApp.ts
  container.ts      -> wires everything together
  server.ts         -> bootstraps Express app

Key behavior
------------

- Non-expiring app_user_session table (Postgres), no Redis.
- Short-lived JWT access token (Authorization: Bearer ...).
- Refresh token stored client-side, mapped to app_user_session row.
- Roles:
  - admin + manager: create/update/delete app_user
  - any authenticated user: list app_user
- Zod validation in DTO layer.
- No inline SQL in repositories: all SQL lives in .sql files under
  src/infrastructure/db/migrations and src/infrastructure/db/sql.

Running
-------

1. Install dependencies:

   npm install


2. Copy .env.example to .env (optional, as dev/prod scripts use specific env files) or configure your own.

3. **Running the Application**:

   - **Development** (Port 3001, `.env.development`):
     ```bash
     npm run dev
     ```

   - **Production** (Port 3000, `.env.production`):
     ```bash
     npm run prod
     ```

4. **Migration & Setup Tool**:
   To set up the database, run migrations, or create an admin user via the UI:

   ```bash
   sh migration/web-tool/start-ui.sh
   ```


Endpoints
---------

POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/app-users          (authenticated)
POST   /api/app-users          (admin/manager)
PUT    /api/app-users/:id      (admin/manager)
DELETE /api/app-users/:id      (admin/manager)

Tests
-----

- Unit test example:
  tests/unit/CreateAppUserUseCase.test.ts

- Integration test example:
  tests/integration/authRoutes.test.ts

You can drop this whole structure into your pawnshop monorepo or adapt
pieces (domains, use-cases, container.ts) as needed.
