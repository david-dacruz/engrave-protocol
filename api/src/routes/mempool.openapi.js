// @ts-check
/**
 * OpenAPI Route Registrations for Mempool Endpoints
 *
 * This file contains all OpenAPI/Swagger documentation for mempool routes.
 * Routes are auto-generated from Zod schemas.
 */

import { z } from 'zod';
import { registerRoute } from '../config/openapi.js';
import {
	// Common schemas
	BitcoinAddressSchema,
	TxidSchema,
	BlockHashSchema,
	// Phase 1 Parameter schemas
	AddressParamSchema,
	TxidParamSchema,
	BlockHashParamSchema,
	BlockHeightParamSchema,
	IntervalParamSchema,

	// Phase 2 Parameter schemas
	VoutParamSchema,
	IndexParamSchema,
	PrefixParamSchema,
	SlugParamSchema,
	TimeperiodParamSchema,
	StartHeightParamSchema,

	// Phase 1 Response schemas
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

	// Phase 2 Response schemas - Address
	AddressTxsChainResponseSchema,
	AddressTxsChainFromResponseSchema,
	AddressPrefixResponseSchema,

	// Phase 2 Response schemas - Transaction
	TransactionMerkleProofResponseSchema,
	TransactionMerkleblockProofResponseSchema,
	TransactionOutspendSingleResponseSchema,
	TransactionRawResponseSchema,
	RecentTransactionsResponseSchema,

	// Phase 2 Response schemas - Block
	BlockHeaderResponseSchema,
	BlockRawResponseSchema,
	BlockStatusResponseSchema,
	BlockTxByIndexResponseSchema,
	BlockTxidsResponseSchema,
	RecentBlocksResponseSchema,
	BlocksFromHeightResponseSchema,
	BlocksTipHashResponseSchema,

	// Phase 2 Response schemas - Mempool
	MempoolRecentResponseSchema,
	MempoolTxidsResponseSchema,

	// Phase 2 Response schemas - Fees
	FeesCpfpResponseSchema,

	// Phase 2 Response schemas - Mining
	MiningPoolResponseSchema,
	MiningPoolHashrateResponseSchema,
	MiningPoolBlocksResponseSchema,
	MiningHashrateResponseSchema,
	MiningDifficultyResponseSchema,
	MiningBlockFeesResponseSchema,
} from '../schemas/mempool.schemas.js';

/**
 * Register all mempool endpoint routes in OpenAPI
 * Call this function to populate the OpenAPI spec with all endpoint documentation
 */
export function registerMempoolRoutes() {
	// ========================================
	// Phase 1: Core Endpoints
	// ========================================

	// GET /api/v1/mempool/address/:address
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/address/{address}',
		summary: 'Get Bitcoin address information',
		description: '🔐 Retrieve detailed information about a Bitcoin address including balance and transaction history. **Cost: $0.10 USDC**',
		tags: ['Address Analytics'],
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

	// GET /api/v1/mempool/address/:address/txs
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/address/{address}/txs',
		summary: 'Get address transactions',
		description: '🔐 Retrieve all transactions for a Bitcoin address. **Cost: $0.25 USDC**',
		tags: ['Address Analytics'],
		requiresPayment: true,
		request: {
			params: AddressParamSchema,
		},
		responses: {
			success: {
				description: 'Transactions retrieved successfully',
				schema: AddressTransactionsResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/tx/:txid
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/tx/{txid}',
		summary: 'Get transaction details',
		description: '🔐 Retrieve detailed information about a specific Bitcoin transaction. **Cost: $0.10 USDC**',
		tags: ['Transactions'],
		requiresPayment: true,
		request: {
			params: TxidParamSchema,
		},
		responses: {
			success: {
				description: 'Transaction details retrieved successfully',
				schema: TransactionResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/tx/:txid/status
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/tx/{txid}/status',
		summary: 'Get transaction confirmation status',
		description: '🔐 Check the confirmation status of a Bitcoin transaction. **Cost: $0.05 USDC**',
		tags: ['Transactions'],
		requiresPayment: true,
		request: {
			params: TxidParamSchema,
		},
		responses: {
			success: {
				description: 'Transaction status retrieved successfully',
				schema: TransactionStatusResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/block/:hash
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/block/{hash}',
		summary: 'Get block information',
		description: '🔐 Retrieve detailed information about a Bitcoin block. **Cost: $0.10 USDC**',
		tags: ['Blocks'],
		requiresPayment: true,
		request: {
			params: BlockHashParamSchema,
		},
		responses: {
			success: {
				description: 'Block information retrieved successfully',
				schema: BlockResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/fees
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/fees',
		summary: 'Get recommended Bitcoin fee rates',
		description: '🔐 Get current Bitcoin network fee recommendations for different confirmation speeds. **Cost: $0.01 USDC** (micropayment)',
		tags: ['Fees & Mempool'],
		requiresPayment: true,
		responses: {
			success: {
				description: 'Fee rates retrieved successfully',
				schema: FeesResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/fees/:interval
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/fees/{interval}',
		summary: 'Get recommended Bitcoin fee rates (with interval)',
		description: '🔐 Get current Bitcoin network fee recommendations. Interval parameter accepted for API compatibility. **Cost: $0.01 USDC** (micropayment)',
		tags: ['Fees & Mempool'],
		requiresPayment: true,
		request: {
			params: IntervalParamSchema,
		},
		responses: {
			success: {
				description: 'Fee rates retrieved successfully',
				schema: FeesWithIntervalResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/stats
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/stats',
		summary: 'Get mempool statistics',
		description: '🔐 Get current Bitcoin mempool statistics including size, fees, and transaction counts. **Cost: $0.01 USDC** (micropayment)',
		tags: ['Fees & Mempool'],
		requiresPayment: true,
		responses: {
			success: {
				description: 'Mempool statistics retrieved successfully',
				schema: MempoolStatsResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/height
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/height',
		summary: 'Get current Bitcoin block height',
		description: 'Get the current Bitcoin block height. **FREE - No payment required**',
		tags: ['Blocks'],
		requiresPayment: false,
		responses: {
			success: {
				description: 'Block height retrieved successfully',
				schema: BlockHeightResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/address/:address/utxo
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/address/{address}/utxo',
		summary: 'Get address UTXOs',
		description: '🔐 Retrieve unspent transaction outputs for a Bitcoin address. **Cost: $0.05 USDC**',
		tags: ['Address Analytics'],
		requiresPayment: true,
		request: {
			params: AddressParamSchema,
		},
		responses: {
			success: {
				description: 'UTXOs retrieved successfully',
				schema: AddressUtxoResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/address/:address/txs/mempool
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/address/{address}/txs/mempool',
		summary: 'Get unconfirmed address transactions',
		description: '🔐 Retrieve unconfirmed transactions for a Bitcoin address. **Cost: $0.02 USDC** (micropayment)',
		tags: ['Address Analytics'],
		requiresPayment: true,
		request: {
			params: AddressParamSchema,
		},
		responses: {
			success: {
				description: 'Mempool transactions retrieved successfully',
				schema: AddressMempoolTxsResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/tx/:txid/hex
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/tx/{txid}/hex',
		summary: 'Get raw transaction hex',
		description: '🔐 Retrieve raw transaction data in hex format. **Cost: $0.03 USDC**',
		tags: ['Transactions'],
		requiresPayment: true,
		request: {
			params: TxidParamSchema,
		},
		responses: {
			success: {
				description: 'Transaction hex retrieved successfully',
				schema: TransactionHexResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/tx/:txid/outspends
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/tx/{txid}/outspends',
		summary: 'Get transaction output spend status',
		description: '🔐 Check if transaction outputs have been spent. **Cost: $0.05 USDC**',
		tags: ['Transactions'],
		requiresPayment: true,
		request: {
			params: TxidParamSchema,
		},
		responses: {
			success: {
				description: 'Output spend status retrieved successfully',
				schema: TransactionOutspendsResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/block/:hash/txs
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/block/{hash}/txs',
		summary: 'Get block transactions',
		description: '🔐 Retrieve all transactions in a block. **Cost: $0.15 USDC**',
		tags: ['Blocks'],
		requiresPayment: true,
		request: {
			params: BlockHashParamSchema,
		},
		responses: {
			success: {
				description: 'Block transactions retrieved successfully',
				schema: BlockTransactionsResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/block-height/:height
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/block-height/{height}',
		summary: 'Get block by height',
		description: '🔐 Retrieve block information by block height. **Cost: $0.05 USDC**',
		tags: ['Blocks'],
		requiresPayment: true,
		request: {
			params: BlockHeightParamSchema,
		},
		responses: {
			success: {
				description: 'Block retrieved successfully',
				schema: BlockByHeightResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/fees/mempool-blocks
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/fees/mempool-blocks',
		summary: 'Get projected mempool blocks',
		description: '🔐 Get projected mempool blocks with fee information. **Cost: $0.02 USDC** (micropayment)',
		tags: ['Fees & Mempool'],
		requiresPayment: true,
		responses: {
			success: {
				description: 'Mempool blocks retrieved successfully',
				schema: MempoolBlocksResponseSchema,
			},
		},
	});

	// ========================================
	// Phase 2: Address Endpoints
	// ========================================

	// GET /api/v1/mempool/address/:address/txs/chain
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/address/{address}/txs/chain',
		summary: 'Get confirmed transaction history',
		description: '🔐 Retrieve only confirmed transactions for a Bitcoin address. **Cost: $0.20 USDC**',
		tags: ['Address Analytics'],
		requiresPayment: true,
		request: {
			params: AddressParamSchema,
		},
		responses: {
			success: {
				description: 'Confirmed transactions retrieved successfully',
				schema: AddressTxsChainResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/address/:address/txs/chain/:txid
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/address/{address}/txs/chain/{txid}',
		summary: 'Get transaction history from specific transaction',
		description: '🔐 Retrieve confirmed transactions starting from a specific TXID. **Cost: $0.20 USDC**',
		tags: ['Address Analytics'],
		requiresPayment: true,
		request: {
			params: z.object({
				address: BitcoinAddressSchema,
				txid: TxidSchema,
			}),
		},
		responses: {
			success: {
				description: 'Transaction history retrieved successfully',
				schema: AddressTxsChainFromResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/address-prefix/:prefix
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/address-prefix/{prefix}',
		summary: 'Search addresses by prefix',
		description: '🔐 Search for Bitcoin addresses matching a prefix. **Cost: $0.05 USDC**',
		tags: ['Address Analytics'],
		requiresPayment: true,
		request: {
			params: PrefixParamSchema,
		},
		responses: {
			success: {
				description: 'Addresses retrieved successfully',
				schema: AddressPrefixResponseSchema,
			},
		},
	});

	// ========================================
	// Phase 2: Transaction Endpoints
	// ========================================

	// GET /api/v1/mempool/tx/:txid/merkle-proof
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/tx/{txid}/merkle-proof',
		summary: 'Get merkle inclusion proof',
		description: '🔐 Get merkle proof for transaction inclusion in a block. **Cost: $0.05 USDC**',
		tags: ['Transactions'],
		requiresPayment: true,
		request: {
			params: TxidParamSchema,
		},
		responses: {
			success: {
				description: 'Merkle proof retrieved successfully',
				schema: TransactionMerkleProofResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/tx/:txid/merkleblock-proof
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/tx/{txid}/merkleblock-proof',
		summary: 'Get merkleblock proof',
		description: '🔐 Get merkleblock proof for transaction. **Cost: $0.05 USDC**',
		tags: ['Transactions'],
		requiresPayment: true,
		request: {
			params: TxidParamSchema,
		},
		responses: {
			success: {
				description: 'Merkleblock proof retrieved successfully',
				schema: TransactionMerkleblockProofResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/tx/:txid/outspend/:vout
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/tx/{txid}/outspend/{vout}',
		summary: 'Check if specific output is spent',
		description: '🔐 Check if a specific transaction output has been spent. **Cost: $0.03 USDC**',
		tags: ['Transactions'],
		requiresPayment: true,
		request: {
			params: z.object({
				txid: TxidSchema,
				vout: z.coerce.number(),
			}),
		},
		responses: {
			success: {
				description: 'Output spend status retrieved successfully',
				schema: TransactionOutspendSingleResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/tx/:txid/raw
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/tx/{txid}/raw',
		summary: 'Get raw transaction binary',
		description: '🔐 Get raw transaction in binary format. **Cost: $0.05 USDC**',
		tags: ['Transactions'],
		requiresPayment: true,
		request: {
			params: TxidParamSchema,
		},
		responses: {
			success: {
				description: 'Raw transaction retrieved successfully',
				schema: TransactionRawResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/txs/recent
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/txs/recent',
		summary: 'Get recent transactions',
		description: '🔐 Get recently confirmed transactions. **Cost: $0.05 USDC**',
		tags: ['Transactions'],
		requiresPayment: true,
		responses: {
			success: {
				description: 'Recent transactions retrieved successfully',
				schema: RecentTransactionsResponseSchema,
			},
		},
	});

	// ========================================
	// Phase 2: Block Endpoints
	// ========================================

	// GET /api/v1/mempool/block/:hash/header
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/block/{hash}/header',
		summary: 'Get block header',
		description: '🔐 Get block header information only. **Cost: $0.03 USDC**',
		tags: ['Blocks'],
		requiresPayment: true,
		request: {
			params: BlockHashParamSchema,
		},
		responses: {
			success: {
				description: 'Block header retrieved successfully',
				schema: BlockHeaderResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/block/:hash/raw
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/block/{hash}/raw',
		summary: 'Get raw block binary',
		description: '🔐 Get raw block in binary format. **Cost: $0.10 USDC**',
		tags: ['Blocks'],
		requiresPayment: true,
		request: {
			params: BlockHashParamSchema,
		},
		responses: {
			success: {
				description: 'Raw block retrieved successfully',
				schema: BlockRawResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/block/:hash/status
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/block/{hash}/status',
		summary: 'Get block confirmation status',
		description: '🔐 Get block confirmation status. **Cost: $0.02 USDC** (micropayment)',
		tags: ['Blocks'],
		requiresPayment: true,
		request: {
			params: BlockHashParamSchema,
		},
		responses: {
			success: {
				description: 'Block status retrieved successfully',
				schema: BlockStatusResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/block/:hash/txs/:index
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/block/{hash}/txs/{index}',
		summary: 'Get transaction by index in block',
		description: '🔐 Get specific transaction by its index in a block. **Cost: $0.05 USDC**',
		tags: ['Blocks'],
		requiresPayment: true,
		request: {
			params: z.object({
				hash: BlockHashSchema,
				index: z.coerce.number(),
			}),
		},
		responses: {
			success: {
				description: 'Transaction retrieved successfully',
				schema: BlockTxByIndexResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/block/:hash/txids
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/block/{hash}/txids',
		summary: 'Get all transaction IDs in block',
		description: '🔐 Get list of all transaction IDs in a block. **Cost: $0.10 USDC**',
		tags: ['Blocks'],
		requiresPayment: true,
		request: {
			params: BlockHashParamSchema,
		},
		responses: {
			success: {
				description: 'Transaction IDs retrieved successfully',
				schema: BlockTxidsResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/blocks
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/blocks',
		summary: 'Get recent blocks',
		description: '🔐 Get recently mined blocks. **Cost: $0.05 USDC**',
		tags: ['Blocks'],
		requiresPayment: true,
		responses: {
			success: {
				description: 'Recent blocks retrieved successfully',
				schema: RecentBlocksResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/blocks/:startHeight
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/blocks/{startHeight}',
		summary: 'Get blocks from specific height',
		description: '🔐 Get blocks starting from a specific height. **Cost: $0.05 USDC**',
		tags: ['Blocks'],
		requiresPayment: true,
		request: {
			params: StartHeightParamSchema,
		},
		responses: {
			success: {
				description: 'Blocks retrieved successfully',
				schema: BlocksFromHeightResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/blocks/tip/hash
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/blocks/tip/hash',
		summary: 'Get latest block hash',
		description: 'Get the hash of the latest block. **FREE - No payment required**',
		tags: ['Blocks'],
		requiresPayment: false,
		responses: {
			success: {
				description: 'Latest block hash retrieved successfully',
				schema: BlocksTipHashResponseSchema,
			},
		},
	});

	// ========================================
	// Phase 2: Mempool Endpoints
	// ========================================

	// GET /api/v1/mempool/mempool/recent
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/mempool/recent',
		summary: 'Get recent mempool transactions',
		description: '🔐 Get recently added mempool transactions. **Cost: $0.03 USDC**',
		tags: ['Fees & Mempool'],
		requiresPayment: true,
		responses: {
			success: {
				description: 'Recent mempool transactions retrieved successfully',
				schema: MempoolRecentResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/mempool/txids
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/mempool/txids',
		summary: 'Get all mempool transaction IDs',
		description: '🔐 Get list of all transaction IDs in mempool. **Cost: $0.05 USDC**',
		tags: ['Fees & Mempool'],
		requiresPayment: true,
		responses: {
			success: {
				description: 'Mempool transaction IDs retrieved successfully',
				schema: MempoolTxidsResponseSchema,
			},
		},
	});

	// ========================================
	// Phase 2: Fee Endpoints
	// ========================================

	// GET /api/v1/mempool/v1/fees/cpfp
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/v1/fees/cpfp',
		summary: 'Get CPFP fee suggestions',
		description: '🔐 Get Child-Pays-For-Parent fee suggestions. **Cost: $0.01 USDC** (micropayment)',
		tags: ['Fees & Mempool'],
		requiresPayment: true,
		responses: {
			success: {
				description: 'CPFP fees retrieved successfully',
				schema: FeesCpfpResponseSchema,
			},
		},
	});

	// ========================================
	// Phase 2: Mining Endpoints
	// ========================================

	// GET /api/v1/mempool/mining/pools
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/mining/pools',
		summary: 'List all mining pools',
		description: '🔐 Get list of all mining pools. **Cost: $0.05 USDC**',
		tags: ['Mining'],
		requiresPayment: true,
		responses: {
			success: {
				description: 'Mining pools retrieved successfully',
				schema: MiningPoolsResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/mining/pools/:timeperiod
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/mining/pools/{timeperiod}',
		summary: 'Get mining pools for timeperiod',
		description: '🔐 Get mining pools statistics for a specific timeperiod. **Cost: $0.05 USDC**',
		tags: ['Mining'],
		requiresPayment: true,
		request: {
			params: TimeperiodParamSchema,
		},
		responses: {
			success: {
				description: 'Mining pools retrieved successfully',
				schema: MiningPoolsResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/mining/pool/:slug
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/mining/pool/{slug}',
		summary: 'Get specific mining pool info',
		description: '🔐 Get detailed information about a specific mining pool. **Cost: $0.03 USDC**',
		tags: ['Mining'],
		requiresPayment: true,
		request: {
			params: SlugParamSchema,
		},
		responses: {
			success: {
				description: 'Mining pool info retrieved successfully',
				schema: MiningPoolResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/mining/pool/:slug/hashrate
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/mining/pool/{slug}/hashrate',
		summary: 'Get mining pool hashrate',
		description: '🔐 Get hashrate data for a specific mining pool. **Cost: $0.03 USDC**',
		tags: ['Mining'],
		requiresPayment: true,
		request: {
			params: SlugParamSchema,
		},
		responses: {
			success: {
				description: 'Pool hashrate retrieved successfully',
				schema: MiningPoolHashrateResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/mining/pool/:slug/blocks
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/mining/pool/{slug}/blocks',
		summary: 'Get blocks mined by pool',
		description: '🔐 Get blocks mined by a specific pool. **Cost: $0.10 USDC**',
		tags: ['Mining'],
		requiresPayment: true,
		request: {
			params: SlugParamSchema,
		},
		responses: {
			success: {
				description: 'Pool blocks retrieved successfully',
				schema: MiningPoolBlocksResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/mining/hashrate
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/mining/hashrate',
		summary: 'Get network hashrate',
		description: '🔐 Get Bitcoin network hashrate statistics. **Cost: $0.03 USDC**',
		tags: ['Mining'],
		requiresPayment: true,
		responses: {
			success: {
				description: 'Network hashrate retrieved successfully',
				schema: MiningHashrateResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/mining/difficulty
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/mining/difficulty',
		summary: 'Get difficulty adjustment history',
		description: '🔐 Get Bitcoin difficulty adjustment history. **Cost: $0.03 USDC**',
		tags: ['Mining'],
		requiresPayment: true,
		responses: {
			success: {
				description: 'Difficulty history retrieved successfully',
				schema: MiningDifficultyResponseSchema,
			},
		},
	});

	// GET /api/v1/mempool/v1/mining/blocks/fees/:blockHeight
	registerRoute({
		method: 'get',
		path: '/api/v1/mempool/v1/mining/blocks/fees/{blockHeight}',
		summary: 'Get block fee details',
		description: '🔐 Get detailed fee information for a specific block. **Cost: $0.05 USDC**',
		tags: ['Mining'],
		requiresPayment: true,
		request: {
			params: BlockHeightParamSchema,
		},
		responses: {
			success: {
				description: 'Block fees retrieved successfully',
				schema: MiningBlockFeesResponseSchema,
			},
		},
	});

	console.log('[OpenAPI] Registered 16 Phase 1 + 27 Phase 2 mempool endpoints (43 total)');
}
