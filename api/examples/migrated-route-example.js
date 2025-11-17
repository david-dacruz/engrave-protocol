// @ts-check
/**
 * Example: Migrated Route using Zod + OpenAPI
 *
 * This file demonstrates the new pattern for defining routes:
 * 1. Define Zod schemas
 * 2. Register route in OpenAPI
 * 3. Use validation middleware
 * 4. Access validated data in handlers
 */

import express from 'express';
import { z } from 'zod';
import { validateParams, validateQuery } from '../src/middleware/validation.js';
import { registerRoute } from '../src/config/openapi.js';
import {
	BitcoinAddressSchema,
	NetworkSchema,
	AddressInfoResponseSchema,
} from '../src/schemas/mempool.schemas.js';

const router = express.Router();

// ========================================
// Example 1: Simple GET with path parameter
// ========================================

// Define parameter schema (if not already in mempool.schemas.js)
const AddressParamSchema = z.object({
	address: BitcoinAddressSchema,
});

// Register in OpenAPI (happens once at module load)
registerRoute({
	method: 'get',
	path: '/api/example/address/{address}',
	summary: 'Get Bitcoin address information (Example)',
	description: `
🔐 Get detailed information about a Bitcoin address.

**Cost: $0.01 USDC** (micropayment via x402)

Returns chain statistics, mempool data, and balance information.
	`.trim(),
	tags: ['Examples'],
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

// Define route with validation
router.get('/address/:address',
	// Validation middleware auto-validates and provides nice error messages
	validateParams(AddressParamSchema),

	// Payment middleware (existing)
	// verifyPayment(...),
	// settlePayment,

	async (req, res) => {
		try {
			// IMPORTANT: Always use req.validated.params (not req.params)
			// Express 5 doesn't allow modifying req.params/req.query directly
			const { address } = req.validated.params;

			// Your business logic here
			const result = {
				success: true,
				address,
				data: {
					address,
					chain_stats: {
						funded_txo_count: 5,
						funded_txo_sum: 100000,
						spent_txo_count: 3,
						spent_txo_sum: 50000,
						tx_count: 8,
					},
					mempool_stats: {
						funded_txo_count: 0,
						funded_txo_sum: 0,
						spent_txo_count: 0,
						spent_txo_sum: 0,
						tx_count: 0,
					},
				},
				network: 'testnet',
			};

			res.json(result);
		} catch (error) {
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	}
);

// ========================================
// Example 2: GET with query parameters
// ========================================

const ListQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1).openapi({
		description: 'Page number',
		example: 1,
	}),
	limit: z.coerce.number().int().min(1).max(100).default(25).openapi({
		description: 'Items per page',
		example: 25,
	}),
	sort: z.enum(['asc', 'desc']).optional().openapi({
		description: 'Sort order',
		example: 'desc',
	}),
});

const TransactionsListResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	transactions: z.array(z.object({
		txid: z.string(),
		value: z.number(),
		timestamp: z.number(),
	})),
	page: z.number(),
	limit: z.number(),
	total: z.number(),
	network: NetworkSchema,
}).openapi('TransactionsListResponse');

registerRoute({
	method: 'get',
	path: '/api/example/transactions',
	summary: 'List recent transactions (Example)',
	description: '🔐 Get paginated list of recent transactions. **Cost: $0.01 USDC**',
	tags: ['Examples'],
	requiresPayment: true,
	request: {
		query: ListQuerySchema,
	},
	responses: {
		success: {
			description: 'Transactions retrieved successfully',
			schema: TransactionsListResponseSchema,
		},
	},
});

router.get('/transactions',
	validateQuery(ListQuerySchema),  // Validates query params
	async (req, res) => {
		// Access validated query parameters with defaults applied
		const { page, limit, sort } = req.validated.query;

		res.json({
			success: true,
			transactions: [
				{ txid: 'abc123', value: 50000, timestamp: Date.now() },
				{ txid: 'def456', value: 75000, timestamp: Date.now() - 60000 },
			],
			page,
			limit,
			total: 100,
			network: 'testnet',
		});
	}
);

// ========================================
// Example 3: Free endpoint (no payment)
// ========================================

const HealthResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	status: z.string().openapi({ example: 'ok' }),
	timestamp: z.number(),
	network: NetworkSchema,
}).openapi('HealthResponse');

registerRoute({
	method: 'get',
	path: '/api/example/health',
	summary: 'Health check (Example - FREE)',
	description: '✅ Health check endpoint. No payment required.',
	tags: ['Examples'],
	requiresPayment: false,  // FREE endpoint
	responses: {
		success: {
			description: 'Service is healthy',
			schema: HealthResponseSchema,
		},
	},
});

router.get('/health',
	// No payment middleware for free endpoints
	async (req, res) => {
		res.json({
			success: true,
			status: 'ok',
			timestamp: Date.now(),
			network: 'testnet',
		});
	}
);

export default router;
