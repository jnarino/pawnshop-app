# Swagger Documentation Guide

## Overview
This project uses **swagger-jsdoc** with JSDoc comments to automatically generate OpenAPI documentation. Documentation lives alongside your code, ensuring it stays up-to-date.

## How It Works

1. **swagger-jsdoc** scans your route files for `@openapi` JSDoc comments
2. Comments are automatically parsed into OpenAPI spec
3. Swagger UI displays the generated documentation at `/api-docs`
4. Every time you restart the server, documentation auto-updates

## Setup (Already Done)

In [swagger.config.ts](../src/config/swagger.config.ts):
```typescript
apis: [
  './src/interfaces/http/route/**/*.ts',
  './src/interfaces/http/controller/**/*.ts',
]
```

This tells swagger-jsdoc to scan all route and controller files.

## How to Document New Endpoints

### Example: Simple GET Endpoint

```typescript
/**
 * @openapi
 * /api/inventory/categories/root:
 *   get:
 *     tags:
 *       - Inventory Categories
 *     summary: Get all root categories
 *     description: Returns a list of all root categories with id and name
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of root categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategorySimple'
 *       401:
 *         description: Unauthorized
 */
router.get('/root', auth, controller.getRootCategories);
```

### Example: GET with Path Parameter

```typescript
/**
 * @openapi
 * /api/inventory/categories/{categoryId}/subcategories:
 *   get:
 *     tags:
 *       - Inventory Categories
 *     summary: Get subcategories by category ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *     responses:
 *       200:
 *         description: List of subcategories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategorySimple'
 */
router.get('/:categoryId/subcategories', auth, controller.getSubCategories);
```

### Example: POST with Request Body

```typescript
/**
 * @openapi
 * /api/customer:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Create a new customer
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth, controller.createCustomer);
```

### Example: Public Endpoint (No Auth)

```typescript
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user
 *     security: []  # Empty array = no authentication required
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', controller.login);
```

## Defining Schemas

Define reusable schemas in [swagger.config.ts](../src/config/swagger.config.ts):

```typescript
components: {
  schemas: {
    CategorySimple: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
      },
    },
    Customer: {
      type: 'object',
      required: ['firstName', 'lastName'],
      properties: {
        id: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        phoneNumber: { type: 'string' },
        email: { type: 'string' },
      },
    },
  }
}
```

Then reference them with `$ref: '#/components/schemas/CategorySimple'`

## Best Practices

1. **Document as you code**: Add JSDoc comments when creating the route
2. **Use meaningful tags**: Group related endpoints (e.g., "Inventory Categories", "Customers")
3. **Define schemas once**: Reuse them with `$ref` instead of duplicating
4. **Include error responses**: Document 400, 401, 404, 500 responses
5. **Add descriptions**: Explain what the endpoint does and any special behavior
6. **Keep URLs consistent**: Use the full path including `/api` prefix

## Common HTTP Methods

- **GET**: Retrieve data (list or single item)
- **POST**: Create new resource
- **PUT**: Update entire resource
- **PATCH**: Partial update
- **DELETE**: Remove resource

## Response Status Codes

- **200**: Success (GET, PUT, PATCH)
- **201**: Created (POST)
- **204**: No Content (DELETE)
- **400**: Bad Request (validation error)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

## Viewing Documentation

1. Start your server: `npm run dev`
2. Open browser: `http://localhost:3301/api-docs`
3. Test endpoints directly from Swagger UI

## Advantages of This Approach

✅ **Documentation lives with code** - easier to keep in sync  
✅ **Auto-updates** - no manual editing of config file  
✅ **Type-safe** - can reference TypeScript interfaces  
✅ **Industry standard** - widely adopted pattern  
✅ **No runtime overhead** - docs generated at startup  
✅ **Easy to test** - Swagger UI provides interactive testing  

## Migration Strategy

For existing endpoints without JSDoc comments:

1. Pick one module (e.g., Auth, Customers)
2. Add JSDoc comments to all routes in that module
3. Test in Swagger UI
4. Repeat for other modules
5. Once complete, remove manual paths from swagger.config.ts

## Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [JSDoc Reference](https://jsdoc.app/)
