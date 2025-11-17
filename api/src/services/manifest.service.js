// @ts-check
/**
 * x402 Manifest Service
 *
 * Generates the .well-known/x402.json manifest for Bazaar discovery.
 * This makes the service discoverable by AI agents and the x402 ecosystem.
 */

import { getPrice, getPaymentToken, getAllPricingData } from '../config/pricing.js';
import { getConfig } from '../config/env.js';

/**
 * Generate x402 service manifest
 * @returns {Object} x402 manifest object
 */
/**
 * Convert token amount from smallest unit to human-readable
 * @param {number} amount - Amount in smallest unit (e.g., lamports)
 * @param {number} decimals - Token decimals
 * @returns {string} Human-readable amount
 */
function formatTokenAmount(amount, decimals) {
	return (amount / Math.pow(10, decimals)).toFixed(decimals > 6 ? 6 : decimals);
}

export function generateManifest() {
	const config = getConfig();
	const paymentToken = getPaymentToken();
	const pricingData = getAllPricingData();

	// Determine base URL
	const baseUrl = config.publicUrl || `http://localhost:${config.port}`;

	return {
		// Service metadata
		name: 'engrave-protocol',
		version: '1.0.0',
		description: 'MCP Server bridging AI Agents on Solana with Bitcoin\'s settlement layer through x402 payment endpoints',

		// x402 configuration
		protocol: 'x402',
		protocolVersion: '1.0',

		// Network & payment info
		network: config.network || 'solana-devnet',
		paymentToken: paymentToken.symbol,
		paymentTokenAddress: paymentToken.mint,
		treasury: config.treasuryPublicKey,

		// Service URLs
		baseUrl,
		docsUrl: `${baseUrl}/api-docs`,
		healthUrl: `${baseUrl}/health`,

		// Supported features
		features: [
			'bitcoin-mempool-queries',
			'bitcoin-address-analytics',
			'transaction-verification',
			'fee-estimation',
			'micropayments',
			'x402-direct-settlement'
		],

		// Available endpoints
		endpoints: [
			// Address Information
			{
				path: '/api/mempool/address/{address}',
				method: 'GET',
				name: 'getAddressInfo',
				description: pricingData.mempool.addressInfo.description,
				category: pricingData.mempool.addressInfo.category,
				discoverable: true,
				price: formatTokenAmount(getPrice('mempool', 'addressInfo'), paymentToken.decimals),
				currency: 'USDC',
				paymentRequired: true,
				inputSchema: {
					type: 'object',
					required: ['address'],
					properties: {
						address: {
							type: 'string',
							description: 'Bitcoin address to query (supports P2PKH, P2SH, Bech32)',
							example: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
							pattern: '^(bc1|tb1|[13]|[2mn])[a-zA-HJ-NP-Z0-9]{25,62}$'
						}
					}
				},
				outputSchema: {
					type: 'object',
					properties: {
						success: { type: 'boolean' },
						address: { type: 'string' },
						data: {
							type: 'object',
							properties: {
								chain_stats: {
									type: 'object',
									properties: {
										funded_txo_count: { type: 'integer', description: 'Number of funded outputs' },
										funded_txo_sum: { type: 'integer', description: 'Total satoshis received' },
										spent_txo_count: { type: 'integer', description: 'Number of spent outputs' },
										spent_txo_sum: { type: 'integer', description: 'Total satoshis spent' },
										tx_count: { type: 'integer', description: 'Total transaction count' }
									}
								},
								mempool_stats: {
									type: 'object',
									description: 'Current mempool statistics for this address'
								}
							}
						},
						network: { type: 'string', enum: ['mainnet', 'testnet'] }
					}
				},
				tags: ['bitcoin', 'address', 'balance']
			},

			// Address Transactions
			{
				path: '/api/mempool/address/{address}/txs',
				method: 'GET',
				name: 'getAddressTransactions',
				description: pricingData.mempool.addressTxs.description,
				category: pricingData.mempool.addressTxs.category,
				discoverable: true,
				price: formatTokenAmount(getPrice('mempool', 'addressTxs'), paymentToken.decimals),
				currency: 'USDC',
				paymentRequired: true,
				inputSchema: {
					type: 'object',
					required: ['address'],
					properties: {
						address: {
							type: 'string',
							description: 'Bitcoin address to query transactions for',
							example: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'
						}
					}
				},
				outputSchema: {
					type: 'object',
					properties: {
						success: { type: 'boolean' },
						address: { type: 'string' },
						transactions: {
							type: 'array',
							items: { type: 'object', description: 'Bitcoin transaction object' }
						},
						count: { type: 'integer', description: 'Number of transactions' },
						network: { type: 'string' }
					}
				},
				tags: ['bitcoin', 'transactions', 'history']
			},

			// Transaction Details
			{
				path: '/api/mempool/tx/{txid}',
				method: 'GET',
				name: 'getTransaction',
				description: pricingData.mempool.transaction.description,
				category: pricingData.mempool.transaction.category,
				discoverable: true,
				price: formatTokenAmount(getPrice('mempool', 'transaction'), paymentToken.decimals),
				currency: 'USDC',
				paymentRequired: true,
				inputSchema: {
					type: 'object',
					required: ['txid'],
					properties: {
						txid: {
							type: 'string',
							description: 'Bitcoin transaction ID (64-character hex string)',
							example: '0a7b15003e28f2441f6baf16957420b11d2b8c0eebb4b9cc4736309f8cb35625',
							pattern: '^[a-fA-F0-9]{64}$'
						}
					}
				},
				outputSchema: {
					type: 'object',
					properties: {
						success: { type: 'boolean' },
						txid: { type: 'string' },
						data: {
							type: 'object',
							properties: {
								version: { type: 'integer' },
								locktime: { type: 'integer' },
								vin: { type: 'array', description: 'Transaction inputs' },
								vout: { type: 'array', description: 'Transaction outputs' },
								size: { type: 'integer', description: 'Transaction size in bytes' },
								weight: { type: 'integer', description: 'Transaction weight units' },
								fee: { type: 'integer', description: 'Transaction fee in satoshis' },
								status: {
									type: 'object',
									properties: {
										confirmed: { type: 'boolean' },
										block_height: { type: 'integer' },
										block_hash: { type: 'string' },
										block_time: { type: 'integer' }
									}
								}
							}
						},
						network: { type: 'string' }
					}
				},
				tags: ['bitcoin', 'transaction', 'verification']
			},

			// Transaction Status
			{
				path: '/api/mempool/tx/{txid}/status',
				method: 'GET',
				name: 'getTransactionStatus',
				description: pricingData.mempool.txStatus.description,
				category: pricingData.mempool.txStatus.category,
				discoverable: true,
				price: formatTokenAmount(getPrice('mempool', 'txStatus'), paymentToken.decimals),
				currency: 'USDC',
				paymentRequired: true,
				inputSchema: {
					type: 'object',
					required: ['txid'],
					properties: {
						txid: {
							type: 'string',
							description: 'Bitcoin transaction ID',
							example: '0a7b15003e28f2441f6baf16957420b11d2b8c0eebb4b9cc4736309f8cb35625',
							pattern: '^[a-fA-F0-9]{64}$'
						}
					}
				},
				outputSchema: {
					type: 'object',
					properties: {
						success: { type: 'boolean' },
						txid: { type: 'string' },
						status: {
							type: 'object',
							properties: {
								confirmed: { type: 'boolean', description: 'Whether transaction is confirmed' },
								block_height: { type: 'integer', description: 'Block height if confirmed' },
								block_hash: { type: 'string', description: 'Block hash if confirmed' },
								block_time: { type: 'integer', description: 'Block timestamp if confirmed' }
							}
						},
						network: { type: 'string' }
					}
				},
				tags: ['bitcoin', 'transaction', 'status']
			},

			// Block Information
			{
				path: '/api/mempool/block/{hash}',
				method: 'GET',
				name: 'getBlock',
				description: pricingData.mempool.block.description,
				category: pricingData.mempool.block.category,
				discoverable: true,
				price: formatTokenAmount(getPrice('mempool', 'block'), paymentToken.decimals),
				currency: 'USDC',
				paymentRequired: true,
				inputSchema: {
					type: 'object',
					required: ['hash'],
					properties: {
						hash: {
							type: 'string',
							description: 'Bitcoin block hash (64-character hex string)',
							example: '000000000000168e4b2c2f23bb654a4d24e4d9e1b7929a267f40eb563d030301',
							pattern: '^[a-fA-F0-9]{64}$'
						}
					}
				},
				outputSchema: {
					type: 'object',
					properties: {
						success: { type: 'boolean' },
						blockHash: { type: 'string' },
						data: {
							type: 'object',
							properties: {
								height: { type: 'integer', description: 'Block height' },
								version: { type: 'integer' },
								timestamp: { type: 'integer', description: 'Block timestamp' },
								tx_count: { type: 'integer', description: 'Number of transactions' },
								size: { type: 'integer', description: 'Block size in bytes' },
								weight: { type: 'integer', description: 'Block weight' },
								merkle_root: { type: 'string', description: 'Merkle root hash' },
								previousblockhash: { type: 'string' },
								nonce: { type: 'integer' },
								bits: { type: 'integer' },
								difficulty: { type: 'number', description: 'Mining difficulty' }
							}
						},
						network: { type: 'string' }
					}
				},
				tags: ['bitcoin', 'block', 'blockchain']
			},

			// Fee Estimation
			{
				path: '/api/mempool/fees',
				method: 'GET',
				name: 'getFeeEstimates',
				description: pricingData.mempool.fees.description,
				category: pricingData.mempool.fees.category,
				discoverable: true,
				price: formatTokenAmount(getPrice('mempool', 'fees'), paymentToken.decimals),
				currency: 'USDC',
				paymentRequired: true,
				micropayment: pricingData.mempool.fees.micropayment,
				inputSchema: {
					type: 'object',
					properties: {}
				},
				outputSchema: {
					type: 'object',
					properties: {
						success: { type: 'boolean' },
						fees: {
							type: 'object',
							properties: {
								fastestFee: { type: 'integer', description: 'Next block fee (sat/vB)' },
								halfHourFee: { type: 'integer', description: '~30 minute fee (sat/vB)' },
								hourFee: { type: 'integer', description: '~60 minute fee (sat/vB)' },
								economyFee: { type: 'integer', description: 'Low priority fee (sat/vB)' },
								minimumFee: { type: 'integer', description: 'Minimum relay fee (sat/vB)' }
							}
						},
						network: { type: 'string' },
						unit: { type: 'string', enum: ['sat/vB'] }
					}
				},
				tags: ['bitcoin', 'fees', 'estimation', 'micropayment']
			},

			// Mempool Statistics
			{
				path: '/api/mempool/stats',
				method: 'GET',
				name: 'getMempoolStats',
				description: pricingData.mempool.stats.description,
				category: pricingData.mempool.stats.category,
				discoverable: true,
				price: formatTokenAmount(getPrice('mempool', 'stats'), paymentToken.decimals),
				currency: 'USDC',
				paymentRequired: true,
				micropayment: pricingData.mempool.stats.micropayment,
				inputSchema: {
					type: 'object',
					properties: {}
				},
				outputSchema: {
					type: 'object',
					properties: {
						success: { type: 'boolean' },
						stats: {
							type: 'object',
							description: 'Current mempool statistics from mempool.space'
						},
						network: { type: 'string' }
					}
				},
				tags: ['bitcoin', 'mempool', 'statistics', 'micropayment']
			},

			// Block Height (FREE)
			{
				path: '/api/mempool/height',
				method: 'GET',
				name: 'getBlockHeight',
				description: pricingData.mempool.height.description,
				category: pricingData.mempool.height.category,
				discoverable: true,
				price: '0.00',
				currency: 'USDC',
				paymentRequired: false,
				free: pricingData.mempool.height.free,
				inputSchema: {
					type: 'object',
					properties: {}
				},
				outputSchema: {
					type: 'object',
					properties: {
						success: { type: 'boolean' },
						height: { type: 'integer', description: 'Current block height' },
						network: { type: 'string', enum: ['mainnet', 'testnet'] }
					}
				},
				tags: ['bitcoin', 'blockchain', 'free']
			}
		],

		// Rate limits
		rateLimit: {
			requestsPerSecond: 10,
			burstLimit: 20
		},

		// Contact & support
		contact: {
			github: 'https://github.com/engrave-protocol/engrave-api',
			documentation: `${baseUrl}/api-docs`
		},

		// Metadata for AI agents
		metadata: {
			generatedAt: new Date().toISOString(),
			specification: 'x402-v1',
			bitcoinNetwork: config.bitcoinNetwork || 'testnet',
			upstreamApi: 'mempool.space',
			categories: [
				'bitcoin',
				'blockchain-data',
				'address-analytics',
				'transaction-verification',
				'fee-estimation',
				'micropayments'
			]
		}
	};
}

/**
 * Get manifest as JSON string
 * @param {boolean} pretty - Whether to pretty-print JSON
 * @returns {string} JSON string
 */
export function getManifestJSON(pretty = true) {
	const manifest = generateManifest();
	return JSON.stringify(manifest, null, pretty ? 2 : 0);
}
