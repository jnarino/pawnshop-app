# Quick Reference: Adding Swagger Documentation

## Template for New Endpoints

```typescript
/**
 * @openapi
 * /api/your-path:
 *   METHOD:
 *     tags:
 *       - Tag Name
 *     summary: Brief description
 *     description: Detailed description (optional)
 *     security:
 *       - bearerAuth: []    # Remove this line for public endpoints
 *     parameters:           # Optional - for path/query params
 *       - in: path          # or 'query'
 *         name: paramName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:          # Optional - for POST/PUT/PATCH
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/YourSchema'
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
router.METHOD('/path', auth, controller.method);
```

## Common Patterns

### GET with ID Parameter
```typescript
/**
 * @openapi
 * /api/resource/{id}:
 *   get:
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
```

### GET with Query Parameters
```typescript
/**
 * @openapi
 * /api/resource/search:
 *   get:
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 */
```

### POST/PUT with Body
```typescript
/**
 * @openapi
 * /api/resource:
 *   post:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Resource'
 */
```

### Array Response
```typescript
/**
 * @openapi
 * responses:
 *   200:
 *     content:
 *       application/json:
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Resource'
 */
```

## Checklist for New Endpoints

- [ ] Add `@openapi` JSDoc comment above route definition
- [ ] Specify correct HTTP method (get/post/put/delete)
- [ ] Add appropriate tag for grouping
- [ ] Include security (bearerAuth) or empty array for public
- [ ] Document all parameters (path, query)
- [ ] Document request body if applicable
- [ ] Document success response (200/201)
- [ ] Document error responses (400/401/404)
- [ ] Test in Swagger UI at `/api-docs`

## Where to Add Documentation

✅ **In route files**: `src/interfaces/http/route/**/*.ts`  
✅ **Above router definitions**: Right before `router.get()`, `router.post()`, etc.

❌ **Not in controllers**: Keep business logic separate  
❌ **Not in swagger.config.ts**: Only define reusable schemas there

## Verification

1. Save your route file
2. Restart server: `npm run dev`
3. Open: `http://localhost:3000/api-docs`
4. Check your endpoint appears in the correct tag section
5. Click "Try it out" to test

## Common Mistakes to Avoid

❌ Wrong path - must include `/api` prefix  
❌ Missing `security: []` for public endpoints  
❌ Misspelled schema names in `$ref`  
❌ Inconsistent parameter names (path vs route)  
❌ Missing required fields in request body

## Tips

💡 Copy-paste from existing endpoints and modify  
💡 Use schemas (`$ref`) instead of inline definitions  
💡 Add examples in schemas for better documentation  
💡 Group related endpoints with consistent tags  
💡 Keep descriptions concise but informative
