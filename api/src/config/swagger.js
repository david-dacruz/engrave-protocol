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
				// Phase 1 Schemas
				MempoolAddressUtxo: {
					type: 'object',
					required: ['success', 'address', 'utxos', 'count', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
							description: 'Request success status',
						},
						address: {
							type: 'string',
							example: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxe9hmw',
							description: 'Bitcoin address queried',
						},
						utxos: {
							type: 'array',
							description: 'Array of unspent transaction outputs',
							items: {
								type: 'object',
								properties: {
									txid: { type: 'string', description: 'Transaction ID' },
									vout: { type: 'integer', description: 'Output index' },
									value: { type: 'integer', description: 'Value in satoshis' },
									status: {
										type: 'object',
										properties: {
											confirmed: { type: 'boolean' },
											block_height: { type: 'integer' },
											block_hash: { type: 'string' },
											block_time: { type: 'integer' },
										},
									},
								},
							},
						},
						count: {
							type: 'integer',
							example: 5,
							description: 'Number of UTXOs',
						},
						network: {
							type: 'string',
							example: 'testnet',
							description: 'Bitcoin network',
						},
					},
				},
				MempoolAddressMempoolTxs: {
					type: 'object',
					required: ['success', 'address', 'transactions', 'count', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						address: {
							type: 'string',
							description: 'Bitcoin address',
						},
						transactions: {
							type: 'array',
							description: 'Unconfirmed transactions',
							items: {
								type: 'object',
								properties: {
									txid: { type: 'string' },
									version: { type: 'integer' },
									locktime: { type: 'integer' },
									vin: { type: 'array', items: { type: 'object' } },
									vout: { type: 'array', items: { type: 'object' } },
									size: { type: 'integer' },
									weight: { type: 'integer' },
									fee: { type: 'integer' },
								},
							},
						},
						count: {
							type: 'integer',
							description: 'Number of transactions',
						},
						network: {
							type: 'string',
						},
					},
				},
				MempoolTransactionHex: {
					type: 'object',
					required: ['success', 'txid', 'hex', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						txid: {
							type: 'string',
							description: 'Transaction ID',
						},
						hex: {
							type: 'string',
							description: 'Raw transaction in hexadecimal format',
							example: '0200000001...',
						},
						network: {
							type: 'string',
						},
					},
				},
				MempoolTransactionOutspends: {
					type: 'object',
					required: ['success', 'txid', 'outspends', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						txid: {
							type: 'string',
							description: 'Transaction ID',
						},
						outspends: {
							type: 'array',
							description: 'Spend status of each output',
							items: {
								type: 'object',
								properties: {
									spent: { type: 'boolean', description: 'Whether output is spent' },
									txid: { type: 'string', description: 'Spending transaction ID (if spent)' },
									vin: { type: 'integer', description: 'Input index in spending tx' },
									status: {
										type: 'object',
										properties: {
											confirmed: { type: 'boolean' },
											block_height: { type: 'integer' },
											block_hash: { type: 'string' },
											block_time: { type: 'integer' },
										},
									},
								},
							},
						},
						network: {
							type: 'string',
						},
					},
				},
				MempoolTransactionBroadcast: {
					type: 'object',
					required: ['success', 'txid', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						txid: {
							type: 'string',
							description: 'Broadcasted transaction ID',
							example: '15e10745f15593a899cef391191bdd3d7c12412cc4696b7bcb669d0feadc8521',
						},
						network: {
							type: 'string',
							example: 'testnet',
						},
					},
				},
				MempoolBlockTransactions: {
					type: 'object',
					required: ['success', 'blockHash', 'transactions', 'count', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						blockHash: {
							type: 'string',
							description: 'Block hash',
						},
						transactions: {
							type: 'array',
							description: 'Array of transactions in block',
							items: {
								type: 'object',
								properties: {
									txid: { type: 'string' },
									version: { type: 'integer' },
									locktime: { type: 'integer' },
									vin: { type: 'array', items: { type: 'object' } },
									vout: { type: 'array', items: { type: 'object' } },
									size: { type: 'integer' },
									weight: { type: 'integer' },
									fee: { type: 'integer' },
									status: { type: 'object' },
								},
							},
						},
						count: {
							type: 'integer',
							description: 'Number of transactions',
						},
						network: {
							type: 'string',
						},
					},
				},
				MempoolBlockByHeight: {
					type: 'object',
					required: ['success', 'height', 'data', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						height: {
							type: 'integer',
							description: 'Block height',
							example: 2500000,
						},
						data: {
							type: 'string',
							description: 'Block hash at this height',
							example: '000000000000002f2c3c9c9ccbae2f3d7d5f1e8e...',
						},
						network: {
							type: 'string',
						},
					},
				},
				MempoolProjectedBlocks: {
					type: 'object',
					required: ['success', 'blocks', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						blocks: {
							type: 'array',
							description: 'Projected mempool blocks with fee data',
							items: {
								type: 'object',
								properties: {
									blockSize: { type: 'integer', description: 'Block size in bytes' },
									blockVSize: { type: 'number', description: 'Virtual size' },
									nTx: { type: 'integer', description: 'Number of transactions' },
									totalFees: { type: 'integer', description: 'Total fees in satoshis' },
									medianFee: { type: 'number', description: 'Median fee rate (sat/vB)' },
									feeRange: {
										type: 'array',
										items: { type: 'number' },
										description: 'Fee range distribution',
									},
								},
							},
						},
						network: {
							type: 'string',
						},
					},
				},
				MempoolBlockHeight: {
					type: 'object',
					required: ['success', 'height', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						height: {
							type: 'integer',
							description: 'Current Bitcoin block height',
							example: 850000,
						},
						network: {
							type: 'string',
							example: 'testnet',
						},
					},
				},
				MempoolStats: {
					type: 'object',
					required: ['success', 'stats', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						stats: {
							type: 'object',
							description: 'Current mempool statistics',
							properties: {
								count: { type: 'integer', description: 'Number of transactions' },
								vsize: { type: 'integer', description: 'Total virtual size' },
								total_fee: { type: 'integer', description: 'Total fees in satoshis' },
								fee_histogram: {
									type: 'array',
									items: {
										type: 'array',
										items: { type: 'number' },
									},
									description: 'Fee rate histogram',
								},
							},
						},
						network: {
							type: 'string',
						},
					},
				},
				MempoolBlockInfo: {
					type: 'object',
					required: ['success', 'blockHash', 'data', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						blockHash: {
							type: 'string',
							description: 'Block hash',
						},
						data: {
							type: 'object',
							description: 'Block information',
							properties: {
								id: { type: 'string' },
								height: { type: 'integer' },
								version: { type: 'integer' },
								timestamp: { type: 'integer' },
								tx_count: { type: 'integer' },
								size: { type: 'integer' },
								weight: { type: 'integer' },
								merkle_root: { type: 'string' },
								previousblockhash: { type: 'string' },
								mediantime: { type: 'integer' },
								nonce: { type: 'integer' },
								bits: { type: 'integer' },
								difficulty: { type: 'number' },
							},
						},
						network: {
							type: 'string',
						},
					},
				},
				MempoolTransactionStatus: {
					type: 'object',
					required: ['success', 'txid', 'status', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						txid: {
							type: 'string',
							description: 'Transaction ID',
						},
						status: {
							type: 'object',
							description: 'Transaction confirmation status',
							properties: {
								confirmed: { type: 'boolean', description: 'Is transaction confirmed' },
								block_height: { type: 'integer', description: 'Block height (if confirmed)' },
								block_hash: { type: 'string', description: 'Block hash (if confirmed)' },
								block_time: { type: 'integer', description: 'Block timestamp' },
							},
						},
						network: {
							type: 'string',
						},
					},
				},
				MempoolAddressTransactions: {
					type: 'object',
					required: ['success', 'address', 'transactions', 'count', 'network'],
					properties: {
						success: {
							type: 'boolean',
							example: true,
						},
						address: {
							type: 'string',
							description: 'Bitcoin address',
						},
						transactions: {
							type: 'array',
							description: 'Transaction history',
							items: {
								type: 'object',
								properties: {
									txid: { type: 'string' },
									version: { type: 'integer' },
									locktime: { type: 'integer' },
									vin: { type: 'array', items: { type: 'object' } },
									vout: { type: 'array', items: { type: 'object' } },
									size: { type: 'integer' },
									weight: { type: 'integer' },
									fee: { type: 'integer' },
									status: { type: 'object' },
								},
							},
						},
						count: {
							type: 'integer',
							description: 'Number of transactions',
						},
						network: {
							type: 'string',
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
				// Phase 2 Schemas
				AddressTxsChain: {
					type: 'object',
					required: ['success', 'address', 'transactions', 'count', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						address: { type: 'string' },
						transactions: { type: 'array', items: { type: 'object' } },
						count: { type: 'integer' },
						network: { type: 'string' },
					},
				},
				AddressPrefix: {
					type: 'object',
					required: ['success', 'prefix', 'data', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						prefix: { type: 'string' },
						data: { type: 'array', items: { type: 'string' } },
						network: { type: 'string' },
					},
				},
				TxMerkleProof: {
					type: 'object',
					required: ['success', 'txid', 'proof', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						txid: { type: 'string' },
						proof: { type: 'object' },
						network: { type: 'string' },
					},
				},
				TxOutspendSingle: {
					type: 'object',
					required: ['success', 'txid', 'vout', 'spent', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						txid: { type: 'string' },
						vout: { type: 'integer' },
						spent: { type: 'object' },
						network: { type: 'string' },
					},
				},
				TxRaw: {
					type: 'object',
					required: ['success', 'txid', 'raw', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						txid: { type: 'string' },
						raw: { type: 'string' },
						network: { type: 'string' },
					},
				},
				TxsRecent: {
					type: 'object',
					required: ['success', 'transactions', 'count', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						transactions: { type: 'array', items: { type: 'object' } },
						count: { type: 'integer' },
						network: { type: 'string' },
					},
				},
				BlockHeader: {
					type: 'object',
					required: ['success', 'hash', 'header', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						hash: { type: 'string' },
						header: { type: 'string' },
						network: { type: 'string' },
					},
				},
				BlockRaw: {
					type: 'object',
					required: ['success', 'hash', 'raw', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						hash: { type: 'string' },
						raw: { type: 'string' },
						network: { type: 'string' },
					},
				},
				BlockStatus: {
					type: 'object',
					required: ['success', 'hash', 'status', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						hash: { type: 'string' },
						status: { type: 'object' },
						network: { type: 'string' },
					},
				},
				BlockTxByIndex: {
					type: 'object',
					required: ['success', 'hash', 'index', 'transaction', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						hash: { type: 'string' },
						index: { type: 'integer' },
						transaction: { type: 'object' },
						network: { type: 'string' },
					},
				},
				BlockTxids: {
					type: 'object',
					required: ['success', 'hash', 'txids', 'count', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						hash: { type: 'string' },
						txids: { type: 'array', items: { type: 'string' } },
						count: { type: 'integer' },
						network: { type: 'string' },
					},
				},
				RecentBlocks: {
					type: 'object',
					required: ['success', 'blocks', 'count', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						blocks: { type: 'array', items: { type: 'object' } },
						count: { type: 'integer' },
						network: { type: 'string' },
					},
				},
				BlocksTipHash: {
					type: 'object',
					required: ['success', 'hash', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						hash: { type: 'string' },
						network: { type: 'string' },
					},
				},
				MempoolRecent: {
					type: 'object',
					required: ['success', 'transactions', 'count', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						transactions: { type: 'array', items: { type: 'object' } },
						count: { type: 'integer' },
						network: { type: 'string' },
					},
				},
				MempoolTxids: {
					type: 'object',
					required: ['success', 'txids', 'count', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						txids: { type: 'array', items: { type: 'string' } },
						count: { type: 'integer' },
						network: { type: 'string' },
					},
				},
				FeesCpfp: {
					type: 'object',
					required: ['success', 'fees', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						fees: { type: 'object' },
						network: { type: 'string' },
					},
				},
				MiningPools: {
					type: 'object',
					required: ['success', 'timeperiod', 'pools', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						timeperiod: { type: 'string' },
						pools: { type: 'array', items: { type: 'object' } },
						network: { type: 'string' },
					},
				},
				MiningPool: {
					type: 'object',
					required: ['success', 'slug', 'pool', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						slug: { type: 'string' },
						pool: { type: 'object' },
						network: { type: 'string' },
					},
				},
				MiningPoolHashrate: {
					type: 'object',
					required: ['success', 'slug', 'hashrate', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						slug: { type: 'string' },
						hashrate: { type: 'object' },
						network: { type: 'string' },
					},
				},
				MiningPoolBlocks: {
					type: 'object',
					required: ['success', 'slug', 'blocks', 'count', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						slug: { type: 'string' },
						blocks: { type: 'array', items: { type: 'object' } },
						count: { type: 'integer' },
						network: { type: 'string' },
					},
				},
				MiningHashrate: {
					type: 'object',
					required: ['success', 'hashrate', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						hashrate: { type: 'object' },
						network: { type: 'string' },
					},
				},
				MiningDifficulty: {
					type: 'object',
					required: ['success', 'difficulty', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						difficulty: { type: 'object' },
						network: { type: 'string' },
					},
				},
				MiningBlockFees: {
					type: 'object',
					required: ['success', 'blockHeight', 'fees', 'network'],
					properties: {
						success: { type: 'boolean', example: true },
						blockHeight: { type: 'integer' },
						fees: { type: 'object' },
						network: { type: 'string' },
					},
				},
			},
		},
		security: [],
	},
	apis: [
		'./src/routes/index.js',
		'./src/routes/mempool.routes.js',
	],
};

export const swaggerSpec = swaggerJsdoc(options);
