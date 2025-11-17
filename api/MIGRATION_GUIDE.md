# Zod + OpenAPI Migration Guide

This guide shows how to migrate from manual Swagger JSDoc annotations to auto-generated OpenAPI from Zod schemas.

## Benefits

✅ **Single Source of Truth** - Zod schemas define types, validation, and documentation
✅ **Runtime Validation** - Automatic request/response validation
✅ **Type Safety** - TypeScript types auto-generated from Zod
✅ **Auto-Generated OpenAPI** - No manual @swagger comments needed
✅ **Better DX** - Catch errors at development time

## Architecture

```
Zod Schema (src/schemas/*.js)
    ↓
├─→ TypeScript Types (via z.infer)
├─→ Runtime Validation (middleware)
└─→ OpenAPI Spec (auto-generated)
```

## Migration Pattern

### Before (Manual Swagger)

```javascript
/**
 * @swagger
 * /api/mempool/address/{address}:
 *   get:
 *     tags: [Mempool]
 *     summary: Get address information
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       '200':
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: {type: boolean}
 *                 address: {type: string}
 */
router.get('/address/:address',
  verifyPayment(getPrice('mempool', 'addressInfo'), ...),
  settlePayment,
  async (req, res) => {
    // Manual validation
    const { address } = req.params;
    const result = await mempoolService.getAddress(address);
    res.json(result);
  }
);
```

### After (Zod + OpenAPI)

```javascript
import { validateParams } from '../middleware/validation.js';
import { AddressParamSchema, AddressInfoResponseSchema } from '../schemas/mempool.schemas.js';
import { registerRoute } from '../config/openapi.js';

// Register route in OpenAPI (once at module load)
registerRoute({
  method: 'get',
  path: '/api/mempool/address/{address}',
  summary: 'Get Bitcoin address information',
  description: '🔐 Get detailed information about a Bitcoin address. **Cost: $0.01 USDC**',
  tags: ['Address Analytics'],
  requiresPayment: true,
  request: {
    params: AddressParamSchema,
  },
  responses: {
    success: {
      description: 'Address information retrieved successfully',
      schema: AddressInfoResponseSchema,
    },
  },
});

// Route handler with validation
router.get('/address/:address',
  validateParams(AddressParamSchema),  // Auto-validates and sanitizes
  verifyPayment(getPrice('mempool', 'addressInfo'), ...),
  settlePayment,
  async (req, res) => {
    // IMPORTANT: Use req.validated.params (not req.params directly)
    // Express 5 doesn't allow modifying req.params/req.query
    const { address } = req.validated.params;
    const result = await mempoolService.getAddress(address);
    res.json(result);
  }
);
```

## Step-by-Step Migration

### 1. Define Zod Schema (if not exists)

```javascript
// src/schemas/mempool.schemas.js
export const MyEndpointResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    // your fields
  }),
  network: NetworkSchema,
}).openapi('MyEndpointResponse');
```

### 2. Register Route in OpenAPI

```javascript
// At the top of your route file
import { registerRoute } from '../config/openapi.js';
import { MyParamSchema, MyResponseSchema } from '../schemas/mempool.schemas.js';

registerRoute({
  method: 'get',
  path: '/api/mempool/my-endpoint/{id}',
  summary: 'Short description',
  description: '🔐 Detailed description. **Cost: $0.01 USDC**',
  tags: ['Category'],
  requiresPayment: true,
  request: {
    params: MyParamSchema,
  },
  responses: {
    success: {
      description: 'Success description',
      schema: MyResponseSchema,
    },
  },
});
```

### 3. Add Validation Middleware

```javascript
import { validateParams } from '../middleware/validation.js';

router.get('/my-endpoint/:id',
  validateParams(MyParamSchema),  // Add validation
  // ... rest of middleware
  async (req, res) => {
    const { id } = req.validated.params;  // Use validated data
    // ...
  }
);
```

### 4. Remove Old Swagger Comments

Delete the `/**  @swagger */` JSDoc block - it's no longer needed!

## Example: Complete Migration

See `examples/migrated-route-example.js` for a complete working example.

## Testing OpenAPI Generation

```bash
# Start server
npm start

# View auto-generated OpenAPI spec
curl http://localhost:3000/openapi.json | jq .

# Count endpoints
curl -s http://localhost:3000/openapi.json | jq '.paths | keys | length'
```

## TypeScript Migration (Optional)

Once all routes use Zod, you can add TypeScript:

```bash
# Install TypeScript
npm install --save-dev typescript @types/node @types/express

# Create tsconfig.json
npx tsc --init

# Rename .js files to .ts
# Update imports to use TypeScript
```

## Common Patterns

### Path Parameters
```javascript
const ParamSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(50),
});
```

### Query Parameters
```javascript
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.enum(['asc', 'desc']).optional(),
});

router.get('/items',
  validateQuery(QuerySchema),
  // ...
);
```

### Array Responses
```javascript
const ItemsResponseSchema = z.object({
  success: z.boolean(),
  items: z.array(ItemSchema),
  count: z.number(),
  page: z.number(),
});
```

## FAQ

**Q: Do I need to migrate all routes at once?**
A: No! You can migrate incrementally. Old Swagger annotations and new Zod routes work side-by-side.

**Q: How do I handle complex nested objects?**
A: Use `z.object()` with nested `z.object()` definitions. Extract common sub-schemas.

**Q: Can I use this with TypeScript?**
A: Yes! Use `z.infer<typeof MySchema>` to get TypeScript types from Zod schemas.

**Q: What about response validation?**
A: Use `validateResponse(schema)` middleware in development to catch response validation errors.

**Q: How do I test the OpenAPI spec?**
A: Visit `/openapi.json` to see the full auto-generated spec.

## Next Steps

1. ✅ Migrate high-traffic endpoints first
2. ✅ Add Zod schemas for all endpoint types
3. ✅ Update route handlers with validation middleware
4. ✅ Remove old Swagger JSDoc comments
5. ✅ Consider migrating to TypeScript for full type safety

## Resources

- [Zod Documentation](https://zod.dev)
- [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi)
- [OpenAPI 3.1 Spec](https://swagger.io/specification/)
