# CLAUDE.md - AI Agent Collaboration Guide

This document provides context and guidelines for AI agents (including Claude Code, Claude Desktop with MCP, and other LLMs) working on the Engrave Protocol codebase.

## Project Context

**Engrave Protocol API** is a production-ready bridge between AI agents and Bitcoin blockchain data, built for the Solana x402 Hackathon. It demonstrates autonomous AI agent payments using the x402 protocol on Solana.

### Core Technologies

- **Node.js 18+** with ES Modules (`type: "module"`)
- **Express 5.1.0** (read-only `req.params` and `req.query`)
- **Zod** for schema validation and type inference
- **@asteasolutions/zod-to-openapi** for auto-generating OpenAPI 3.1 specs
- **x402-solana** for micropayment integration
- **Bottleneck** for rate limiting

## Architecture Principles

### 1. Zod-First Development

**Zod schemas are the single source of truth** for:
- Runtime validation
- TypeScript types (via `z.infer<typeof Schema>`)
- OpenAPI documentation (auto-generated)

#### Adding a New Endpoint

**Step 1**: Define schema in `src/schemas/mempool.schemas.js`:
```javascript
export const MyDataResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.string().openapi({ description: 'The data' }),
  network: NetworkSchema,
}).openapi('MyDataResponse');
```

**Step 2**: Register in OpenAPI at `src/routes/mempool.openapi.js`:
```javascript
registerRoute({
  method: 'get',
  path: '/api/v1/mempool/my-data',
  summary: 'Get my data',
  description: '🔐 Detailed description. **Cost: $0.05 USDC**',
  tags: ['Category Name'],
  requiresPayment: true,  // or false for free endpoints
  request: {
    params: MyParamSchema,  // optional
  },
  responses: {
    success: {
      description: 'Data retrieved successfully',
      schema: MyDataResponseSchema,
    },
  },
});
```

**Step 3**: Implement handler in `src/routes/mempool.routes.js`:
```javascript
router.get('/my-data',
  verifyPayment(getPrice('mempool', 'myData'), '/api/v1/mempool/my-data', 'Description'),
  settlePayment,
  createHandler(
    mempoolService.getMyData.bind(mempoolService),
    (req) => [req.params.id],  // extract params
    (result, [id]) => ({        // format response
      success: true,
      data: result.data,
      network: mempoolService.network,
    })
  )
);
```

### 2. Express 5 Compatibility

**Important**: Express 5.1.0 has read-only `req.params` and `req.query`. The validation middleware stores validated data in `req.validated`:

```javascript
// CORRECT - Use req.validated
const { address } = req.validated.params;

// INCORRECT - Don't use req.params directly
const { address } = req.params;  // May not be validated!
```

### 3. Payment Integration

All paid endpoints follow this pattern:

```javascript
router.get('/endpoint',
  verifyPayment(price, path, description),  // Check payment
  settlePayment,                            // Settle after response
  async (req, res) => {
    // Handler implementation
  }
);
```

**Payment middleware**:
- `verifyPayment`: Checks x402 payment headers, returns 402 if missing/invalid
- `settlePayment`: Settles payment asynchronously after sending response

### 4. Error Handling

All errors are handled centrally by middleware in `src/middleware/errorHandler.js`. Handlers should:

```javascript
// Service methods return { success, data, error, statusCode }
const result = await mempoolService.getAddress(address);

if (!result.success) {
  return res.status(result.statusCode || 500).json({
    error: 'Query failed',
    message: result.error,
  });
}

return res.json({
  success: true,
  address,
  data: result.data,
  network: mempoolService.network,
});
```

## Code Organization

### Directory Structure Logic

```
src/
├── config/          # Configuration (OpenAPI, pricing, etc.)
├── middleware/      # Express middleware (validation, CORS, errors)
├── routes/          # Route definitions
│   ├── *.routes.js     # Actual Express routes
│   ├── *.openapi.js    # OpenAPI registrations
│   └── openapi.routes.js  # OpenAPI spec endpoint
├── schemas/         # Zod schemas (single source of truth)
├── services/        # Business logic (mempool client, x402, MCP)
└── mcp/             # Model Context Protocol server
```

### File Naming Conventions

- `*.service.js` - Business logic services
- `*.routes.js` - Express route handlers
- `*.openapi.js` - OpenAPI schema registrations
- `*.schemas.js` - Zod schema definitions
- `*.middleware.js` - Express middleware

## Common Tasks

### Adding a New Schema

1. **Define in `src/schemas/mempool.schemas.js`**:
```javascript
export const NewSchema = z.object({
  field: z.string().openapi({ description: 'Field description' }),
}).openapi('SchemaName');
```

2. **Add to exports object**:
```javascript
export const schemas = {
  // ... existing schemas
  NewSchema,
};
```

### Adding Request Validation

Use the `validateRequest` middleware:

```javascript
import { validateRequest } from '../middleware/validation.js';
import { MyParamSchema } from '../schemas/mempool.schemas.js';

router.get('/endpoint/:id',
  validateRequest(MyParamSchema, 'params'),  // Validate params
  async (req, res) => {
    const { id } = req.validated.params;  // Use validated data
    // ...
  }
);
```

### Adding Pricing

Update `pricing.config.js`:

```javascript
export const PRICING = {
  mempool: {
    myEndpoint: 0.05,  // $0.05 USDC
  },
};
```

## Testing

### Manual Testing

```bash
# Start server
npm start

# Test free endpoint
curl http://localhost:3000/api/v1/mempool/height

# Test paid endpoint (will return 402)
curl http://localhost:3000/api/v1/mempool/address/tb1q...
```

### Automated Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/x402-integration.test.js

# Watch mode
npm run test:watch
```

## Debugging

### Common Issues

**1. "Cannot set property query"**
- Cause: Trying to set `req.params` or `req.query` in Express 5
- Fix: Use `req.validated.params` or `req.validated.query`

**2. "Schema is not defined"**
- Cause: Forgot to import schema in OpenAPI file
- Fix: Add schema to import statement in `src/routes/mempool.openapi.js`

**3. "Validation error: error.errors.map is not a function"**
- Cause: Using `error.errors` instead of `error.issues` for Zod errors
- Fix: Use `error.issues.map()` for Zod validation errors

**4. OpenAPI generation fails**
- Cause: Schema doesn't have `.openapi()` call
- Fix: Add `.openapi('SchemaName')` to all schemas used in OpenAPI

### Debug Logging

The codebase uses console.log with prefixes:

```javascript
console.log('[MEMPOOL]', 'Message');
console.log('[X402]', 'Payment verified');
console.log('[OpenAPI]', 'Registered routes');
```

## MCP Integration

The API implements the Model Context Protocol (MCP) in `src/mcp/server.js`. MCP allows AI agents to discover and use API endpoints autonomously.

### MCP Tools

Each MCP tool corresponds to an API endpoint:

```javascript
{
  name: 'query_mempool_address',
  description: 'Get Bitcoin address information',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Bitcoin address' }
    }
  }
}
```

### Testing MCP

```bash
# Start MCP server
npm run mcp:start

# Use MCP Inspector for debugging
npm run mcp:inspect
```

## Best Practices

### DO

✅ **Define Zod schemas first** before implementing routes
✅ **Use `req.validated.*`** instead of `req.params` or `req.query`
✅ **Add `.openapi()` metadata** to all schemas
✅ **Use the generic `createHandler`** for consistent error handling
✅ **Follow pricing tiers**: $0.01-$0.02 (micro), $0.03-$0.10 (standard), $0.15-$0.25 (premium)
✅ **Test with actual payments** using x402 integration tests
✅ **Use JSDoc types** for better IDE support

### DON'T

❌ **Don't modify `req.params` or `req.query`** directly (Express 5 read-only)
❌ **Don't skip schema validation** - all requests should be validated
❌ **Don't hardcode prices** - use `getPrice()` from pricing config
❌ **Don't forget `.bind(mempoolService)`** when using service methods
❌ **Don't use inline schemas** in OpenAPI registrations - define them in schemas file
❌ **Don't access `error.errors`** - use `error.issues` for Zod errors

## Git Workflow

### Commit Messages

Follow conventional commits:

```
feat: add new endpoint for block headers
fix: resolve validation error in address endpoint
docs: update README with new pricing
refactor: extract payment logic to middleware
test: add integration tests for x402 flow
```

### Branch Naming

```
feature/add-block-headers
fix/validation-error-address
docs/update-pricing-table
refactor/payment-middleware
```

## External Dependencies

### Critical Dependencies

- **zod** (^4.1.12) - Schema validation
- **@asteasolutions/zod-to-openapi** (^8.1.0) - OpenAPI generation
- **x402-solana** (^0.1.3) - Payment protocol
- **express** (^5.1.0) - Web framework
- **axios** (^1.7.9) - HTTP client for mempool.space
- **bottleneck** (^2.19.5) - Rate limiting

### API Limits

- **Mempool.space**: 10 requests/second (handled by Bottleneck)
- **Solana RPC**: Variable (configure in .env)

## Resources

### Documentation
- [Zod Documentation](https://zod.dev)
- [OpenAPI 3.1 Spec](https://spec.openapi.org/oas/v3.1.0)
- [x402 Protocol](https://www.x402.org)
- [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html)

### Internal Docs
- `MIGRATION_GUIDE.md` - Guide for migrating routes to Zod + OpenAPI
- `examples/migrated-route-example.js` - Complete working example

## Questions?

If you're an AI agent working on this codebase and encounter issues:

1. Check `MIGRATION_GUIDE.md` for pattern examples
2. Look at `examples/migrated-route-example.js` for working code
3. Review existing endpoints in `src/routes/mempool.routes.js`
4. Examine schema patterns in `src/schemas/mempool.schemas.js`

---

**Last Updated**: 2025-11-17
**Maintained By**: Engrave Protocol Contributors
