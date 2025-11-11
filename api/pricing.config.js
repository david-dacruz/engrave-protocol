// @ts-check
/**
 * Pricing Configuration
 *
 * All prices are in USD (human-readable format).
 * They will be automatically converted to token base units.
 *
 * Update prices here and restart the server.
 */

export default {
	version: '1.0.0',
	currency: 'USDC',
	lastUpdated: '2025-11-11',

	// Mempool.space Bridge Endpoints
	mempool: {
		addressInfo: {
			price: 0.10,
			description: 'Get Bitcoin address information',
			category: 'address-analytics',
		},
		addressTxs: {
			price: 0.25,
			description: 'Get address transaction history',
			category: 'address-analytics',
		},
		transaction: {
			price: 0.10,
			description: 'Get transaction details',
			category: 'transaction-verification',
		},
		txStatus: {
			price: 0.05,
			description: 'Get transaction confirmation status',
			category: 'transaction-verification',
		},
		block: {
			price: 0.10,
			description: 'Get block information',
			category: 'blockchain-data',
		},
		fees: {
			price: 0.01,
			description: 'Get fee estimates',
			category: 'fee-estimation',
			micropayment: true,
		},
		stats: {
			price: 0.01,
			description: 'Get mempool statistics',
			category: 'network-statistics',
			micropayment: true,
		},
		height: {
			price: 0.00,
			description: 'Get current block height',
			category: 'blockchain-data',
			free: true,
		},
	},

	// Pricing tiers (multipliers applied to base prices)
	tiers: {
		free: 1.0,
		basic: 1.0,
		premium: 0.75,   // 25% discount
		enterprise: 0.5, // 50% discount
	},
};
