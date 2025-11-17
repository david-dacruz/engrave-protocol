// @ts-check
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { schemas } from '../schemas/mempool.schemas.js';

/**
 * OpenAPI Generator using Zod Schemas
 * Auto-generates OpenAPI 3.1 spec from Zod schemas
 */

// Create registry
export const registry = new OpenAPIRegistry();

// Register all schemas
Object.entries(schemas).forEach(([name, schema]) => {
	if (schema._def && schema._def.openapi) {
		registry.register(name, schema);
	}
});

/**
 * Register a route in the OpenAPI registry
 * @param {Object} config Route configuration
 * @param {string} config.method HTTP method
 * @param {string} config.path Route path
 * @param {string} config.summary Short description
 * @param {string} config.description Detailed description
 * @param {string[]} config.tags Tags for grouping
 * @param {Object} config.request Request configuration
 * @param {Object} config.responses Response configuration
 * @param {boolean} config.requiresPayment Whether route requires x402 payment
 */
export function registerRoute(config) {
	const {
		method,
		path,
		summary,
		description,
		tags = ['Mempool'],
		request = {},
		responses = {},
		requiresPayment = true,
	} = config;

	// Build security based on payment requirement
	const security = requiresPayment ? [{ x402Payment: [] }] : [];

	// Build response object
	const responseObject = {};

	// Add success response
	if (responses.success) {
		responseObject['200'] = {
			description: responses.success.description || 'Success',
			content: {
				'application/json': {
					schema: responses.success.schema,
				},
			},
		};
	}

	// Add payment required response for paid endpoints
	if (requiresPayment) {
		responseObject['402'] = {
			description: 'Payment required',
			content: {
				'application/json': {
					schema: schemas.PaymentRequiredResponseSchema,
				},
			},
		};
	}

	// Add error response
	responseObject['500'] = {
		description: 'Server error',
		content: {
			'application/json': {
				schema: schemas.ErrorResponseSchema,
			},
		},
	};

	// Register the route
	registry.registerPath({
		method,
		path,
		summary,
		description,
		tags,
		security,
		request,
		responses: responseObject,
	});
}

/**
 * Generate the complete OpenAPI specification
 * @returns {Object} OpenAPI 3.1 specification
 */
export function generateOpenAPISpec() {
	const generator = new OpenApiGeneratorV31(registry.definitions);

	return generator.generateDocument({
		openapi: '3.1.0',
		info: {
			title: 'Engrave Protocol API',
			version: '1.0.0',
			description: `MCP Server bridging AI Agents on Solana with Bitcoin's settlement layer through x402 payment endpoints.

## Features
- Mempool.space Bridge for Bitcoin data queries
- Bitcoin address analytics and transaction verification
- Fee estimation and mempool statistics
- Solana USDC payments via x402 protocol
- AI agent discovery via .well-known/x402.json

## x402 Payment Protocol
All paid endpoints require x402 payment headers for access.

### Payment Tiers
- **Micropayments** ($0.01 USDC) - All paid endpoints
- **Free** - Block height and tip hash endpoints

### Payment Headers
- Endpoints marked with lock icon (🔐) require x402 payment
- Free endpoints are available without payment
- All payments settled on Solana Devnet`,
			contact: {
				name: 'Engrave Protocol',
				url: 'https://github.com/engrave-protocol/engrave-api',
			},
			license: {
				name: 'MIT',
				url: 'https://github.com/engrave-protocol/engrave-api/blob/main/LICENSE',
			},
		},
		servers: [
			{
				url: 'http://localhost:3000',
				description: 'Development server',
			},
			{
				url: 'https://api.engrave.dev',
				description: 'Production server',
			},
		],
		components: {
			securitySchemes: {
				x402Payment: {
					type: 'apiKey',
					in: 'header',
					name: 'X-Require-Payment',
					description: 'x402 payment protocol headers for micropayments',
				},
			},
		},
		security: [],
	});
}

/**
 * Helper to create route registration from existing endpoint data
 * @param {string} method HTTP method
 * @param {string} path Route path
 * @param {Object} options Configuration options
 * @returns {Function} Registration function
 */
export function createRouteRegistration(method, path, options) {
	return () => registerRoute({
		method,
		path,
		...options,
	});
}
