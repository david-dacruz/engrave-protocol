// @ts-check
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

/**
 * Mempool API Zod Schemas
 * Single source of truth for:
 * - TypeScript types (via z.infer)
 * - Runtime validation
 * - OpenAPI schema generation
 */

// ========================================
// Common Schemas
// ========================================

export const NetworkSchema = z.enum(['mainnet', 'testnet']).openapi({
	description: 'Bitcoin network',
	example: 'testnet',
});

export const BitcoinAddressSchema = z.string().openapi({
	description: 'Bitcoin address',
	example: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxe9hmw',
});

export const TxidSchema = z.string().length(64).openapi({
	description: 'Transaction ID (64-character hex string)',
	example: 'abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
});

export const BlockHashSchema = z.string().length(64).openapi({
	description: 'Block hash (64-character hex string)',
	example: '00000000000000000001234567890abcdef1234567890abcdef1234567890ab',
});

// ========================================
// Response Schemas
// ========================================

export const AddressInfoResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	address: BitcoinAddressSchema,
	data: z.object({
		address: z.string(),
		chain_stats: z.object({
			funded_txo_count: z.number(),
			funded_txo_sum: z.number(),
			spent_txo_count: z.number(),
			spent_txo_sum: z.number(),
			tx_count: z.number(),
		}),
		mempool_stats: z.object({
			funded_txo_count: z.number(),
			funded_txo_sum: z.number(),
			spent_txo_count: z.number(),
			spent_txo_sum: z.number(),
			tx_count: z.number(),
		}),
	}),
	network: NetworkSchema,
}).openapi('AddressInfoResponse');

export const AddressTransactionsResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	address: BitcoinAddressSchema,
	transactions: z.array(z.object({
		txid: TxidSchema,
		version: z.number(),
		locktime: z.number(),
		size: z.number(),
		weight: z.number(),
		fee: z.number(),
		status: z.object({
			confirmed: z.boolean(),
			block_height: z.number().optional(),
			block_hash: z.string().optional(),
			block_time: z.number().optional(),
		}),
	})),
	count: z.number().openapi({ description: 'Number of transactions' }),
	network: NetworkSchema,
}).openapi('AddressTransactionsResponse');

export const TransactionResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	txid: TxidSchema,
	data: z.object({
		txid: TxidSchema,
		version: z.number(),
		locktime: z.number(),
		size: z.number(),
		weight: z.number(),
		fee: z.number(),
		vin: z.array(z.object({
			txid: TxidSchema.optional(),
			vout: z.number().optional(),
			scriptsig: z.string().optional(),
			sequence: z.number().optional(),
			witness: z.array(z.string()).optional(),
		})),
		vout: z.array(z.object({
			scriptpubkey: z.string(),
			scriptpubkey_type: z.string(),
			value: z.number(),
		})),
		status: z.object({
			confirmed: z.boolean(),
			block_height: z.number().optional(),
			block_hash: z.string().optional(),
			block_time: z.number().optional(),
		}),
	}),
	network: NetworkSchema,
}).openapi('TransactionResponse');

export const BlockResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	hash: BlockHashSchema,
	data: z.object({
		id: BlockHashSchema,
		height: z.number(),
		version: z.number(),
		timestamp: z.number(),
		bits: z.number(),
		nonce: z.number(),
		difficulty: z.number(),
		merkle_root: z.string(),
		tx_count: z.number(),
		size: z.number(),
		weight: z.number(),
		previousblockhash: BlockHashSchema.optional(),
	}),
	network: NetworkSchema,
}).openapi('BlockResponse');

export const FeesResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	data: z.object({
		fastestFee: z.number().openapi({ description: 'Fastest confirmation fee (sat/vB)' }),
		halfHourFee: z.number().openapi({ description: '~30 min confirmation fee (sat/vB)' }),
		hourFee: z.number().openapi({ description: '~1 hour confirmation fee (sat/vB)' }),
		economyFee: z.number().openapi({ description: 'Economy fee (sat/vB)' }),
		minimumFee: z.number().openapi({ description: 'Minimum relay fee (sat/vB)' }),
	}),
	network: NetworkSchema,
}).openapi('FeesResponse');

export const MempoolStatsResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	data: z.object({
		count: z.number().openapi({ description: 'Number of transactions in mempool' }),
		vsize: z.number().openapi({ description: 'Total virtual size of mempool' }),
		total_fee: z.number().openapi({ description: 'Total fees in mempool' }),
		fee_histogram: z.array(z.tuple([z.number(), z.number()])),
	}),
	network: NetworkSchema,
}).openapi('MempoolStatsResponse');

export const BlockHeightResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	height: z.number().openapi({ description: 'Current block height', example: 2500000 }),
	network: NetworkSchema,
}).openapi('BlockHeightResponse');

// ========================================
// Phase 2 Response Schemas
// ========================================

export const AddressUtxoResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	address: BitcoinAddressSchema,
	utxos: z.array(z.object({
		txid: TxidSchema,
		vout: z.number(),
		value: z.number(),
		status: z.object({
			confirmed: z.boolean(),
			block_height: z.number().optional(),
		}),
	})),
	count: z.number(),
	network: NetworkSchema,
}).openapi('AddressUtxoResponse');

export const AddressMempoolTxsResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	address: BitcoinAddressSchema,
	transactions: z.array(z.any()),
	count: z.number(),
	network: NetworkSchema,
}).openapi('AddressMempoolTxsResponse');

export const TransactionStatusResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	txid: TxidSchema,
	status: z.object({
		confirmed: z.boolean(),
		block_height: z.number().optional(),
		block_hash: BlockHashSchema.optional(),
		block_time: z.number().optional(),
	}),
	network: NetworkSchema,
}).openapi('TransactionStatusResponse');

export const TransactionHexResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	txid: TxidSchema,
	hex: z.string().openapi({ description: 'Raw transaction hex' }),
	network: NetworkSchema,
}).openapi('TransactionHexResponse');

export const TransactionOutspendsResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	txid: TxidSchema,
	outspends: z.array(z.object({
		spent: z.boolean(),
		txid: TxidSchema.optional(),
		vin: z.number().optional(),
		status: z.object({
			confirmed: z.boolean(),
			block_height: z.number().optional(),
		}).optional(),
	})),
	network: NetworkSchema,
}).openapi('TransactionOutspendsResponse');

export const BlockTransactionsResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	blockHash: BlockHashSchema,
	transactions: z.array(z.any()),
	count: z.number(),
	network: NetworkSchema,
}).openapi('BlockTransactionsResponse');

export const BlockByHeightResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	height: z.number(),
	data: z.any(),
	network: NetworkSchema,
}).openapi('BlockByHeightResponse');

export const MempoolBlocksResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	blocks: z.array(z.any()),
	network: NetworkSchema,
}).openapi('MempoolBlocksResponse');

export const FeesWithIntervalResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	interval: z.string().openapi({ example: 'next' }),
	fees: z.object({
		fastestFee: z.number(),
		halfHourFee: z.number(),
		hourFee: z.number(),
		economyFee: z.number(),
		minimumFee: z.number(),
	}),
	network: NetworkSchema,
	unit: z.string().openapi({ example: 'sat/vB' }),
}).openapi('FeesWithIntervalResponse');

export const MiningPoolsResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	timeperiod: z.string().openapi({ example: '24h' }),
	pools: z.array(z.object({
		poolId: z.number(),
		name: z.string(),
		link: z.string(),
		blockCount: z.number(),
		rank: z.number(),
		emptyBlocks: z.number(),
		slug: z.string(),
	})),
	network: NetworkSchema,
}).openapi('MiningPoolsResponse');

// ========================================
// Phase 2 Response Schemas - Address Endpoints
// ========================================

export const AddressTxsChainResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	address: BitcoinAddressSchema,
	transactions: z.array(z.any()),
	count: z.number(),
	network: NetworkSchema,
}).openapi('AddressTxsChainResponse');

export const AddressTxsChainFromResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	address: BitcoinAddressSchema,
	fromTxid: TxidSchema,
	transactions: z.array(z.any()),
	count: z.number(),
	network: NetworkSchema,
}).openapi('AddressTxsChainFromResponse');

export const AddressPrefixResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	prefix: z.string(),
	data: z.any(),
	network: NetworkSchema,
}).openapi('AddressPrefixResponse');

// ========================================
// Phase 2 Response Schemas - Transaction Endpoints
// ========================================

export const TransactionMerkleProofResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	txid: TxidSchema,
	proof: z.any(),
	network: NetworkSchema,
}).openapi('TransactionMerkleProofResponse');

export const TransactionMerkleblockProofResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	txid: TxidSchema,
	proof: z.any(),
	network: NetworkSchema,
}).openapi('TransactionMerkleblockProofResponse');

export const TransactionOutspendSingleResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	txid: TxidSchema,
	vout: z.number(),
	spent: z.any(),
	network: NetworkSchema,
}).openapi('TransactionOutspendSingleResponse');

export const TransactionRawResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	txid: TxidSchema,
	raw: z.any(),
	network: NetworkSchema,
}).openapi('TransactionRawResponse');

export const RecentTransactionsResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	transactions: z.array(z.any()),
	count: z.number(),
	network: NetworkSchema,
}).openapi('RecentTransactionsResponse');

// ========================================
// Phase 2 Response Schemas - Block Endpoints
// ========================================

export const BlockHeaderResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	hash: BlockHashSchema,
	header: z.any(),
	network: NetworkSchema,
}).openapi('BlockHeaderResponse');

export const BlockRawResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	hash: BlockHashSchema,
	raw: z.any(),
	network: NetworkSchema,
}).openapi('BlockRawResponse');

export const BlockStatusResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	hash: BlockHashSchema,
	status: z.any(),
	network: NetworkSchema,
}).openapi('BlockStatusResponse');

export const BlockTxByIndexResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	hash: BlockHashSchema,
	index: z.number(),
	transaction: z.any(),
	network: NetworkSchema,
}).openapi('BlockTxByIndexResponse');

export const BlockTxidsResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	hash: BlockHashSchema,
	txids: z.array(z.string()),
	count: z.number(),
	network: NetworkSchema,
}).openapi('BlockTxidsResponse');

export const RecentBlocksResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	blocks: z.array(z.any()),
	count: z.number(),
	network: NetworkSchema,
}).openapi('RecentBlocksResponse');

export const BlocksFromHeightResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	startHeight: z.number(),
	blocks: z.array(z.any()),
	count: z.number(),
	network: NetworkSchema,
}).openapi('BlocksFromHeightResponse');

export const BlocksTipHashResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	hash: BlockHashSchema,
	network: NetworkSchema,
}).openapi('BlocksTipHashResponse');

// ========================================
// Phase 2 Response Schemas - Mempool Endpoints
// ========================================

export const MempoolRecentResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	transactions: z.array(z.any()),
	count: z.number(),
	network: NetworkSchema,
}).openapi('MempoolRecentResponse');

export const MempoolTxidsResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	txids: z.array(z.string()),
	count: z.number(),
	network: NetworkSchema,
}).openapi('MempoolTxidsResponse');

// ========================================
// Phase 2 Response Schemas - Fee Endpoints
// ========================================

export const FeesCpfpResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	fees: z.any(),
	network: NetworkSchema,
}).openapi('FeesCpfpResponse');

// ========================================
// Phase 2 Response Schemas - Mining Endpoints
// ========================================

export const MiningPoolResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	slug: z.string(),
	pool: z.any(),
	network: NetworkSchema,
}).openapi('MiningPoolResponse');

export const MiningPoolHashrateResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	slug: z.string(),
	hashrate: z.any(),
	network: NetworkSchema,
}).openapi('MiningPoolHashrateResponse');

export const MiningPoolBlocksResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	slug: z.string(),
	blocks: z.array(z.any()),
	count: z.number(),
	network: NetworkSchema,
}).openapi('MiningPoolBlocksResponse');

export const MiningHashrateResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	hashrate: z.any(),
	network: NetworkSchema,
}).openapi('MiningHashrateResponse');

export const MiningDifficultyResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	difficulty: z.any(),
	network: NetworkSchema,
}).openapi('MiningDifficultyResponse');

export const MiningBlockFeesResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	blockHeight: z.number(),
	fees: z.any(),
	network: NetworkSchema,
}).openapi('MiningBlockFeesResponse');

// ========================================
// Request Parameter Schemas
// ========================================

export const AddressParamSchema = z.object({
	address: BitcoinAddressSchema,
}).openapi('AddressParam');

export const TxidParamSchema = z.object({
	txid: TxidSchema,
}).openapi('TxidParam');

export const BlockHashParamSchema = z.object({
	hash: BlockHashSchema,
}).openapi('BlockHashParam');

export const BlockHeightParamSchema = z.object({
	height: z.coerce.number().int().positive().openapi({
		description: 'Block height',
		example: 2500000,
	}),
}).openapi('BlockHeightParam');

export const IntervalParamSchema = z.object({
	interval: z.string().openapi({
		description: 'Time interval (accepted for compatibility but not used)',
		example: 'next',
	}),
}).openapi('IntervalParam');

// Phase 2 Parameter Schemas
export const VoutParamSchema = z.object({
	vout: z.coerce.number().int().nonnegative().openapi({
		description: 'Transaction output index',
		example: 0,
	}),
}).openapi('VoutParam');

export const IndexParamSchema = z.object({
	index: z.coerce.number().int().nonnegative().openapi({
		description: 'Index position',
		example: 0,
	}),
}).openapi('IndexParam');

export const PrefixParamSchema = z.object({
	prefix: z.string().openapi({
		description: 'Address prefix to search',
		example: 'tb1q',
	}),
}).openapi('PrefixParam');

export const SlugParamSchema = z.object({
	slug: z.string().openapi({
		description: 'Mining pool slug',
		example: 'foundryusa',
	}),
}).openapi('SlugParam');

export const TimeperiodParamSchema = z.object({
	timeperiod: z.string().openapi({
		description: 'Time period (24h, 3d, 1w, 1m, 3m, 6m, 1y, 2y, 3y, all)',
		example: '24h',
	}),
}).openapi('TimeperiodParam');

export const StartHeightParamSchema = z.object({
	startHeight: z.coerce.number().int().positive().openapi({
		description: 'Starting block height',
		example: 2500000,
	}),
}).openapi('StartHeightParam');

// ========================================
// Error Schemas
// ========================================

export const ErrorResponseSchema = z.object({
	success: z.boolean().openapi({ example: false }),
	error: z.string().openapi({ description: 'Error message' }),
	statusCode: z.number().optional().openapi({ description: 'HTTP status code' }),
}).openapi('ErrorResponse');

export const PaymentRequiredResponseSchema = z.object({
	error: z.string().openapi({ example: 'Payment required' }),
	price: z.number().openapi({ description: 'Required payment amount in token base units' }),
	priceUSD: z.number().openapi({ description: 'Price in USD' }),
	token: z.string().openapi({ description: 'Payment token address' }),
	recipient: z.string().openapi({ description: 'Payment recipient address' }),
	x402Headers: z.object({
		'X-Require-Payment': z.string(),
		'X-Accept-Payment': z.string(),
	}),
}).openapi('PaymentRequiredResponse');

// Export all schemas for easy access
export const schemas = {
	// Common
	NetworkSchema,
	BitcoinAddressSchema,
	TxidSchema,
	BlockHashSchema,

	// Phase 1 Responses
	AddressInfoResponseSchema,
	AddressTransactionsResponseSchema,
	TransactionResponseSchema,
	TransactionStatusResponseSchema,
	BlockResponseSchema,
	FeesResponseSchema,
	FeesWithIntervalResponseSchema,
	MempoolStatsResponseSchema,
	BlockHeightResponseSchema,
	AddressUtxoResponseSchema,
	AddressMempoolTxsResponseSchema,
	TransactionHexResponseSchema,
	TransactionOutspendsResponseSchema,
	BlockTransactionsResponseSchema,
	BlockByHeightResponseSchema,
	MempoolBlocksResponseSchema,
	MiningPoolsResponseSchema,

	// Phase 2 Responses - Address
	AddressTxsChainResponseSchema,
	AddressTxsChainFromResponseSchema,
	AddressPrefixResponseSchema,

	// Phase 2 Responses - Transaction
	TransactionMerkleProofResponseSchema,
	TransactionMerkleblockProofResponseSchema,
	TransactionOutspendSingleResponseSchema,
	TransactionRawResponseSchema,
	RecentTransactionsResponseSchema,

	// Phase 2 Responses - Block
	BlockHeaderResponseSchema,
	BlockRawResponseSchema,
	BlockStatusResponseSchema,
	BlockTxByIndexResponseSchema,
	BlockTxidsResponseSchema,
	RecentBlocksResponseSchema,
	BlocksFromHeightResponseSchema,
	BlocksTipHashResponseSchema,

	// Phase 2 Responses - Mempool
	MempoolRecentResponseSchema,
	MempoolTxidsResponseSchema,

	// Phase 2 Responses - Fees
	FeesCpfpResponseSchema,

	// Phase 2 Responses - Mining
	MiningPoolResponseSchema,
	MiningPoolHashrateResponseSchema,
	MiningPoolBlocksResponseSchema,
	MiningHashrateResponseSchema,
	MiningDifficultyResponseSchema,
	MiningBlockFeesResponseSchema,

	// Phase 1 Request Parameters
	AddressParamSchema,
	TxidParamSchema,
	BlockHashParamSchema,
	BlockHeightParamSchema,
	IntervalParamSchema,

	// Phase 2 Request Parameters
	VoutParamSchema,
	IndexParamSchema,
	PrefixParamSchema,
	SlugParamSchema,
	TimeperiodParamSchema,
	StartHeightParamSchema,

	// Errors
	ErrorResponseSchema,
	PaymentRequiredResponseSchema,
};
