// @ts-check
import swaggerJsdoc from 'swagger-jsdoc';
import { getAllPricingData } from './pricing.js';

/**
 * OpenAPI 3.1 Specification Configuration
 * Generates comprehensive API documentation with pricing information
 */

const options = {
	definition: {
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
- **Standard** ($0.05-$0.25 USDC) - Address analytics, transactions, blocks
- **Micropayments** ($0.01 USDC) - Fee estimates, mempool stats
- **Free** - Block height endpoint

### Payment Headers
- Endpoints marked with lock icon (🔐) require x402 payment
- Free endpoints are available without payment
- All payments settled on Solana Devnet`,
			contact: {
				name: 'Engrave Protocol',
				url: 'https://github.com/david-dacruz/engrave-protocol',
			},
			license: {
				name: 'MIT',
				url: 'https://github.com/david-dacruz/engrave-protocol/blob/main/LICENSE',
			},
		},
		servers: [
			{
				url: 'http://localhost:3000',
				description: 'Development server',
				variables: {
					protocol: {
						default: 'http',
						enum: ['http', 'https'],
					},
					host: {
						default: 'localhost:3000',
					},
				},
			},
		],
		components: {
			securitySchemes: {
				x402: {
					type: 'apiKey',
					in: 'header',
					name: 'X-Payment',
					description: 'x402 Payment Required header containing payment proof from Solana wallet',
				},
			},
			schemas: {
				Error: {
					type: 'object',
					required: ['error', 'message'],
					properties: {
						error: {
							type: 'string',
							description: 'Error type',
						},
						message: {
							type: 'string',
							description: 'Error message',
						},
					},
				},
				PaymentRequired: {
					type: 'object',
					required: ['code', 'message', 'receipt'],
					properties: {
						code: {
							type: 'integer',
							example: 402,
							description: 'HTTP 402 Payment Required status code',
						},
						message: {
							type: 'string',
							example: 'Payment required to access this resource',
							description: 'Payment required message',
						},
						receipt: {
							type: 'object',
							description: 'Payment receipt with required details',
							properties: {
								token: {
									type: 'string',
									description: 'Payment token (USDC, USDT, SOL, BONK)',
								},
								amount: {
									type: 'number',
									description: 'Amount required in token units',
								},
								recipient: {
									type: 'string',
									description: 'Solana wallet address to send payment to',
								},
								reference: {
									type: 'string',
									description: 'Unique reference ID for this payment request',
								},
								memo: {
									type: 'string',
									description: 'Memo for the transaction',
								},
								expiresAt: {
									type: 'string',
									format: 'date-time',
									description: 'When this payment request expires',
								},
							},
						},
					},
				},
				HealthResponse: {
					type: 'object',
					properties: {
						status: {
							type: 'string',
							example: 'healthy',
							description: 'Service health status',
						},
						service: {
							type: 'string',
							example: 'Engrave Protocol MCP Server',
							description: 'Service name',
						},
						timestamp: {
							type: 'string',
							format: 'date-time',
							description: 'Response timestamp',
						},
						version: {
							type: 'string',
							example: '1.0.0',
							description: 'API version',
						},
						features: {
							type: 'object',
							properties: {
								bitcoinWallet: { type: 'boolean' },
								ordinalsInscription: { type: 'boolean' },
								mempoolBridge: { type: 'boolean' },
								mcpServer: { type: 'boolean' },
								x402Payments: { type: 'boolean' },
							},
						},
						endpoints: {
							type: 'object',
							properties: {
								inscription: { type: 'string' },
								ordinals: { type: 'string' },
								bitcoin: { type: 'string' },
								mempool: { type: 'string' },
								health: { type: 'string' },
								apiDocs: { type: 'string' },
							},
						},
					},
				},
				BitcoinAddress: {
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						address: {
							type: 'string',
							example: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
							description: 'Generated Bitcoin address',
						},
						publicKey: {
							type: 'string',
							description: 'Public key for the address',
						},
						index: {
							type: 'integer',
							example: 0,
							description: 'Address derivation index',
						},
						network: {
							type: 'string',
							example: 'testnet',
							description: 'Bitcoin network (mainnet, testnet, regtest)',
						},
					},
				},
				MempoolAddressInfo: {
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						address: {
							type: 'string',
							description: 'Bitcoin address',
						},
						data: {
							type: 'object',
							description: 'Address information from Mempool.io',
							properties: {
								address: { type: 'string' },
								chain_stats: {
									type: 'object',
									properties: {
										funded_txo_count: { type: 'integer' },
										funded_txo_sum: { type: 'integer' },
										spent_txo_count: { type: 'integer' },
										spent_txo_sum: { type: 'integer' },
										tx_count: { type: 'integer' },
									},
								},
								mempool_stats: {
									type: 'object',
									properties: {
										funded_txo_count: { type: 'integer' },
										funded_txo_sum: { type: 'integer' },
										spent_txo_count: { type: 'integer' },
										spent_txo_sum: { type: 'integer' },
										tx_count: { type: 'integer' },
									},
								},
							},
						},
						network: {
							type: 'string',
							example: 'testnet',
						},
					},
				},
				MempoolTransaction: {
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						txid: {
							type: 'string',
							description: 'Transaction ID',
						},
						data: {
							type: 'object',
							description: 'Transaction details from Mempool.io',
							properties: {
								txid: { type: 'string' },
								version: { type: 'integer' },
								locktime: { type: 'integer' },
								vin: { type: 'array' },
								vout: { type: 'array' },
								size: { type: 'integer' },
								weight: { type: 'integer' },
								fee: { type: 'integer' },
								status: { type: 'object' },
							},
						},
						network: {
							type: 'string',
						},
					},
				},
				MempoolFees: {
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						fees: {
							type: 'object',
							properties: {
								fastestFee: { type: 'number', description: 'Fastest fee (sat/vB)' },
								halfHourFee: { type: 'number', description: 'Half hour fee (sat/vB)' },
								hourFee: { type: 'number', description: 'Hour fee (sat/vB)' },
								economyFee: { type: 'number', description: 'Economy fee (sat/vB)' },
								minimumFee: { type: 'number', description: 'Minimum fee (sat/vB)' },
							},
						},
						network: {
							type: 'string',
						},
						unit: {
							type: 'string',
							example: 'sat/vB',
						},
					},
				},
				OrdinalInscription: {
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						inscription: {
							type: 'object',
							properties: {
								id: { type: 'string' },
								content: { type: 'string' },
								contentType: { type: 'string' },
								creator: { type: 'string' },
								timestamp: {
									type: 'string',
									format: 'date-time',
								},
							},
						},
					},
				},
			},
		},
		security: [],
	},
	apis: [
		'./src/routes/mempool.routes.js',
	],
};

export const swaggerSpec = swaggerJsdoc(options);
