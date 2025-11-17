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
	// All endpoints set to $0.01 USDC micropayment (except free endpoints)
	mempool: {
		addressInfo: {
			price: 0.01,
			description: 'Get Bitcoin address information',
			category: 'address-analytics',
			micropayment: true,
		},
		addressTxs: {
			price: 0.01,
			description: 'Get address transaction history',
			category: 'address-analytics',
			micropayment: true,
		},
		transaction: {
			price: 0.01,
			description: 'Get transaction details',
			category: 'transaction-verification',
			micropayment: true,
		},
		txStatus: {
			price: 0.01,
			description: 'Get transaction confirmation status',
			category: 'transaction-verification',
			micropayment: true,
		},
		block: {
			price: 0.01,
			description: 'Get block information',
			category: 'blockchain-data',
			micropayment: true,
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
		// Phase 1 Endpoints
		addressUtxo: {
			price: 0.01,
			description: 'Get unspent transaction outputs for address',
			category: 'address-analytics',
			micropayment: true,
		},
		addressTxsMempool: {
			price: 0.01,
			description: 'Get unconfirmed transactions for address',
			category: 'address-analytics',
			micropayment: true,
		},
		txHex: {
			price: 0.01,
			description: 'Get raw transaction hex',
			category: 'transaction-verification',
			micropayment: true,
		},
		txOutspends: {
			price: 0.01,
			description: 'Get transaction output spend status',
			category: 'transaction-verification',
			micropayment: true,
		},
		blockTxs: {
			price: 0.01,
			description: 'Get block transactions',
			category: 'blockchain-data',
			micropayment: true,
		},
		blockHeight: {
			price: 0.01,
			description: 'Get block by height',
			category: 'blockchain-data',
			micropayment: true,
		},
		mempoolBlocks: {
			price: 0.01,
			description: 'Get projected mempool blocks',
			category: 'fee-estimation',
			micropayment: true,
		},
	},
};
