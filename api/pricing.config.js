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
		// Phase 2: Address Endpoints
		addressTxsChain: {
			price: 0.01,
			description: 'Get confirmed transaction history only',
			category: 'address-analytics',
			micropayment: true,
		},
		addressTxsChainFrom: {
			price: 0.01,
			description: 'Get confirmed transaction history from specific transaction',
			category: 'address-analytics',
			micropayment: true,
		},
		addressPrefix: {
			price: 0.01,
			description: 'Search addresses by prefix',
			category: 'address-analytics',
			micropayment: true,
		},
		// Phase 2: Transaction Endpoints
		txMerkleProof: {
			price: 0.01,
			description: 'Get merkle inclusion proof for transaction',
			category: 'transaction-verification',
			micropayment: true,
		},
		txMerkleblockProof: {
			price: 0.01,
			description: 'Get merkleblock proof for transaction',
			category: 'transaction-verification',
			micropayment: true,
		},
		txOutspendSingle: {
			price: 0.01,
			description: 'Check if specific transaction output is spent',
			category: 'transaction-verification',
			micropayment: true,
		},
		txRaw: {
			price: 0.01,
			description: 'Get raw transaction in binary format',
			category: 'transaction-verification',
			micropayment: true,
		},
		txsRecent: {
			price: 0.01,
			description: 'Get recent transactions',
			category: 'transaction-verification',
			micropayment: true,
		},
		// Phase 2: Block Endpoints
		blockHeader: {
			price: 0.01,
			description: 'Get block header only',
			category: 'blockchain-data',
			micropayment: true,
		},
		blockRaw: {
			price: 0.01,
			description: 'Get raw block in binary format',
			category: 'blockchain-data',
			micropayment: true,
		},
		blockStatus: {
			price: 0.01,
			description: 'Get block confirmation status',
			category: 'blockchain-data',
			micropayment: true,
		},
		blockTxByIndex: {
			price: 0.01,
			description: 'Get specific transaction by index in block',
			category: 'blockchain-data',
			micropayment: true,
		},
		blockTxids: {
			price: 0.01,
			description: 'Get all transaction IDs in a block',
			category: 'blockchain-data',
			micropayment: true,
		},
		blocks: {
			price: 0.01,
			description: 'Get recent blocks',
			category: 'blockchain-data',
			micropayment: true,
		},
		blocksFromHeight: {
			price: 0.01,
			description: 'Get blocks starting from height',
			category: 'blockchain-data',
			micropayment: true,
		},
		blocksTipHash: {
			price: 0.00,
			description: 'Get latest block hash',
			category: 'blockchain-data',
			free: true,
		},
		// Phase 2: Mempool Endpoints
		mempoolRecent: {
			price: 0.01,
			description: 'Get recent mempool transactions',
			category: 'network-statistics',
			micropayment: true,
		},
		mempoolTxids: {
			price: 0.01,
			description: 'Get all transaction IDs in mempool',
			category: 'network-statistics',
			micropayment: true,
		},
		// Phase 2: Fee Endpoints
		feesCpfp: {
			price: 0.01,
			description: 'Child-Pays-For-Parent fee suggestions',
			category: 'fee-estimation',
			micropayment: true,
		},
		// Phase 2: Mining Endpoints
		miningPools: {
			price: 0.01,
			description: 'List of mining pools',
			category: 'mining-analytics',
			micropayment: true,
		},
		miningPoolsTimeperiod: {
			price: 0.01,
			description: 'Mining pools for specific timeperiod',
			category: 'mining-analytics',
			micropayment: true,
		},
		miningPool: {
			price: 0.01,
			description: 'Specific mining pool information',
			category: 'mining-analytics',
			micropayment: true,
		},
		miningPoolHashrate: {
			price: 0.01,
			description: 'Mining pool hashrate data',
			category: 'mining-analytics',
			micropayment: true,
		},
		miningPoolBlocks: {
			price: 0.01,
			description: 'Blocks mined by specific pool',
			category: 'mining-analytics',
			micropayment: true,
		},
		miningHashrate: {
			price: 0.01,
			description: 'Network hashrate statistics',
			category: 'mining-analytics',
			micropayment: true,
		},
		miningDifficulty: {
			price: 0.01,
			description: 'Difficulty adjustment history',
			category: 'mining-analytics',
			micropayment: true,
		},
		miningBlockFees: {
			price: 0.01,
			description: 'Fee details for specific block',
			category: 'mining-analytics',
			micropayment: true,
		},
	},
};
