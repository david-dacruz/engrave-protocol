// @ts-check
import axios from 'axios';
import Bottleneck from 'bottleneck';
import { config } from '../config/env.js';

/**
 * Mempool.space API Service
 * Provides access to Bitcoin blockchain data via mempool.io
 *
 * Rate Limiting:
 * - Respects mempool.space API rate limits (free tier: ~10 req/sec)
 * - Configurable via MEMPOOL_RATE_LIMIT_REQUESTS and MEMPOOL_RATE_LIMIT_WINDOW_MS
 * - Uses bottleneck library for robust queue-based rate limiting
 */

const MEMPOOL_API_BASE = 'https://mempool.space/api';
const MEMPOOL_TESTNET_API_BASE = 'https://mempool.space/testnet/api';

class MempoolService {
	constructor() {
		this.network = process.env.BITCOIN_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
		this.baseURL = this.network === 'mainnet' ? MEMPOOL_API_BASE : MEMPOOL_TESTNET_API_BASE;

		this.client = axios.create({
			baseURL: this.baseURL,
			timeout: 10000,
			headers: {
				'Accept': 'application/json',
			},
		});

		// Initialize rate limiter based on configuration
		// maxConcurrent: 1 ensures requests are processed sequentially
		// minTime: controls the minimum time between requests
		this.rateLimiter = new Bottleneck({
			maxConcurrent: 1,
			minTime: config.mempool.rateLimitWindowMs / config.mempool.rateLimitRequests,
			reservoir: config.mempool.rateLimitRequests,
			reservoirRefreshAmount: config.mempool.rateLimitRequests,
			reservoirRefreshInterval: config.mempool.rateLimitWindowMs,
		});

		console.log(`[MEMPOOL] Initialized for ${this.network}`);
		console.log(`[MEMPOOL] Base URL: ${this.baseURL}`);
		console.log(`[MEMPOOL] Rate Limiting: ${config.mempool.rateLimitRequests} requests per ${config.mempool.rateLimitWindowMs}ms`);

		// Log rate limiting events
		this.rateLimiter.on('dropped', () => {
			console.warn('[MEMPOOL] Rate limit: Request dropped (queue overflow)');
		});

		this.rateLimiter.on('error', (error) => {
			console.error('[MEMPOOL] Rate limiter error:', error.message);
		});
	}

	/**
	 * Wraps an HTTP request with rate limiting
	 * @param {Function} requestFn - Async function that makes the HTTP request
	 * @param {string} methodName - Name of the method making the request (for logging)
	 * @returns {Promise<Object>}
	 * @private
	 */
	async _executeWithRateLimit(requestFn, methodName) {
		try {
			return await this.rateLimiter.schedule(async () => {
				return await requestFn();
			});
		} catch (error) {
			// Rate limiter itself threw an error
			console.error(`[MEMPOOL] Rate limiter error in ${methodName}:`, error.message);
			throw error;
		}
	}

	/**
	 * Get address information and balance
	 * @param {string} address - Bitcoin address
	 * @returns {Promise<Object>}
	 */
	async getAddress(address) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/address/${address}`),
				'getAddress'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getAddress');
		}
	}

	/**
	 * Get transactions for an address
	 * @param {string} address - Bitcoin address
	 * @returns {Promise<Object>}
	 */
	async getAddressTransactions(address) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/address/${address}/txs`),
				'getAddressTransactions'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getAddressTransactions');
		}
	}

	/**
	 * Get transaction details
	 * @param {string} txid - Transaction ID
	 * @returns {Promise<Object>}
	 */
	async getTransaction(txid) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/tx/${txid}`),
				'getTransaction'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getTransaction');
		}
	}

	/**
	 * Get transaction confirmation status
	 * @param {string} txid - Transaction ID
	 * @returns {Promise<Object>}
	 */
	async getTransactionStatus(txid) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/tx/${txid}/status`),
				'getTransactionStatus'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getTransactionStatus');
		}
	}

	/**
	 * Get block by hash
	 * @param {string} hash - Block hash
	 * @returns {Promise<Object>}
	 */
	async getBlock(hash) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/block/${hash}`),
				'getBlock'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getBlock');
		}
	}

	/**
	 * Get current block height
	 * @returns {Promise<Object>}
	 */
	async getBlockHeight() {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get('/blocks/tip/height'),
				'getBlockHeight'
			);
			return {
				success: true,
				height: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getBlockHeight');
		}
	}

	/**
	 * Get recommended fee rates
	 * @returns {Promise<Object>}
	 */
	async getRecommendedFees() {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get('/v1/fees/recommended'),
				'getRecommendedFees'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getRecommendedFees');
		}
	}

	/**
	 * Get current mempool statistics
	 * @returns {Promise<Object>}
	 */
	async getMempoolStats() {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get('/mempool'),
				'getMempoolStats'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getMempoolStats');
		}
	}

	/**
	 * Handle API errors
	 * @param {Error} error - Error object
	 * @param {string} method - Method name
	 * @returns {Object} Error response
	 * @private
	 */
	handleError(error, method) {
		// Check for rate limit errors
		if (error.response && error.response.status === 429) {
			console.warn(`[MEMPOOL] Rate limited in ${method}: Mempool.space API returned 429 Too Many Requests`);
		} else {
			console.error(`[MEMPOOL] Error in ${method}:`, error.message);
		}

		if (error.response) {
			return {
				success: false,
				error: error.response.data || error.message,
				statusCode: error.response.status,
			};
		}

		return {
			success: false,
			error: error.message || 'Unknown error',
		};
	}

	/**
	 * Get network information
	 * @returns {Object}
	 */
	getNetworkInfo() {
		return {
			network: this.network,
			baseURL: this.baseURL,
		};
	}

	/**
	 * Get UTXOs for an address (Phase 1)
	 * @param {string} address - Bitcoin address
	 * @returns {Promise<Object>}
	 */
	async getAddressUtxo(address) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/address/${address}/utxo`),
				'getAddressUtxo'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getAddressUtxo');
		}
	}

	/**
	 * Get unconfirmed transactions for an address (Phase 1)
	 * @param {string} address - Bitcoin address
	 * @returns {Promise<Object>}
	 */
	async getAddressMempoolTxs(address) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/address/${address}/txs/mempool`),
				'getAddressMempoolTxs'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getAddressMempoolTxs');
		}
	}

	/**
	 * Get raw transaction hex (Phase 1)
	 * @param {string} txid - Transaction ID
	 * @returns {Promise<Object>}
	 */
	async getTransactionHex(txid) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/tx/${txid}/hex`),
				'getTransactionHex'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getTransactionHex');
		}
	}

	/**
	 * Get transaction output spend status (Phase 1)
	 * @param {string} txid - Transaction ID
	 * @returns {Promise<Object>}
	 */
	async getTransactionOutspends(txid) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/tx/${txid}/outspends`),
				'getTransactionOutspends'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getTransactionOutspends');
		}
	}

	/**
	 * Get block transactions (Phase 1)
	 * @param {string} hash - Block hash
	 * @returns {Promise<Object>}
	 */
	async getBlockTransactions(hash) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/block/${hash}/txs`),
				'getBlockTransactions'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getBlockTransactions');
		}
	}

	/**
	 * Get block by height (Phase 1)
	 * @param {number|string} height - Block height
	 * @returns {Promise<Object>}
	 */
	async getBlockByHeight(height) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/block-height/${height}`),
				'getBlockByHeight'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getBlockByHeight');
		}
	}

	/**
	 * Get projected mempool blocks (Phase 1)
	 * @returns {Promise<Object>}
	 */
	async getMempoolBlocks() {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get('/v1/fees/mempool-blocks'),
				'getMempoolBlocks'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getMempoolBlocks');
		}
	}

	// ========================================
	// Phase 2: Address Endpoints
	// ========================================

	/**
	 * Get confirmed transaction history only (Phase 2)
	 * @param {string} address - Bitcoin address
	 * @returns {Promise<Object>}
	 */
	async getAddressTxsChain(address) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/address/${address}/txs/chain`),
				'getAddressTxsChain'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getAddressTxsChain');
		}
	}

	/**
	 * Get confirmed transaction history from specific transaction (Phase 2)
	 * @param {string} address - Bitcoin address
	 * @param {string} txid - Transaction ID to start from
	 * @returns {Promise<Object>}
	 */
	async getAddressTxsChainFrom(address, txid) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/address/${address}/txs/chain/${txid}`),
				'getAddressTxsChainFrom'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getAddressTxsChainFrom');
		}
	}

	/**
	 * Search addresses by prefix (Phase 2)
	 * @param {string} prefix - Address prefix
	 * @returns {Promise<Object>}
	 */
	async getAddressByPrefix(prefix) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/address-prefix/${prefix}`),
				'getAddressByPrefix'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getAddressByPrefix');
		}
	}

	// ========================================
	// Phase 2: Transaction Endpoints
	// ========================================

	/**
	 * Get merkle inclusion proof for transaction (Phase 2)
	 * @param {string} txid - Transaction ID
	 * @returns {Promise<Object>}
	 */
	async getTransactionMerkleProof(txid) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/tx/${txid}/merkle-proof`),
				'getTransactionMerkleProof'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getTransactionMerkleProof');
		}
	}

	/**
	 * Get merkleblock proof for transaction (Phase 2)
	 * @param {string} txid - Transaction ID
	 * @returns {Promise<Object>}
	 */
	async getTransactionMerkleblockProof(txid) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/tx/${txid}/merkleblock-proof`),
				'getTransactionMerkleblockProof'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getTransactionMerkleblockProof');
		}
	}

	/**
	 * Check if specific transaction output is spent (Phase 2)
	 * @param {string} txid - Transaction ID
	 * @param {number} vout - Output index
	 * @returns {Promise<Object>}
	 */
	async getTransactionOutspendSingle(txid, vout) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/tx/${txid}/outspend/${vout}`),
				'getTransactionOutspendSingle'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getTransactionOutspendSingle');
		}
	}

	/**
	 * Get raw transaction in binary format (Phase 2)
	 * @param {string} txid - Transaction ID
	 * @returns {Promise<Object>}
	 */
	async getTransactionRaw(txid) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/tx/${txid}/raw`),
				'getTransactionRaw'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getTransactionRaw');
		}
	}

	/**
	 * Get recent transactions (Phase 2)
	 * @returns {Promise<Object>}
	 */
	async getRecentTransactions() {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get('/txs/recent'),
				'getRecentTransactions'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getRecentTransactions');
		}
	}

	// ========================================
	// Phase 2: Block Endpoints
	// ========================================

	/**
	 * Get block header only (Phase 2)
	 * @param {string} hash - Block hash
	 * @returns {Promise<Object>}
	 */
	async getBlockHeader(hash) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/block/${hash}/header`),
				'getBlockHeader'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getBlockHeader');
		}
	}

	/**
	 * Get raw block in binary format (Phase 2)
	 * @param {string} hash - Block hash
	 * @returns {Promise<Object>}
	 */
	async getBlockRaw(hash) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/block/${hash}/raw`),
				'getBlockRaw'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getBlockRaw');
		}
	}

	/**
	 * Get block confirmation status (Phase 2)
	 * @param {string} hash - Block hash
	 * @returns {Promise<Object>}
	 */
	async getBlockStatus(hash) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/block/${hash}/status`),
				'getBlockStatus'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getBlockStatus');
		}
	}

	/**
	 * Get specific transaction by index in block (Phase 2)
	 * @param {string} hash - Block hash
	 * @param {number} index - Transaction index
	 * @returns {Promise<Object>}
	 */
	async getBlockTxByIndex(hash, index) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/block/${hash}/txs/${index}`),
				'getBlockTxByIndex'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getBlockTxByIndex');
		}
	}

	/**
	 * Get all transaction IDs in a block (Phase 2)
	 * @param {string} hash - Block hash
	 * @returns {Promise<Object>}
	 */
	async getBlockTxids(hash) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/block/${hash}/txids`),
				'getBlockTxids'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getBlockTxids');
		}
	}

	/**
	 * Get recent blocks (Phase 2)
	 * @param {number} startHeight - Optional start height
	 * @returns {Promise<Object>}
	 */
	async getRecentBlocks(startHeight = null) {
		try {
			const endpoint = startHeight ? `/blocks/${startHeight}` : '/blocks';
			const response = await this._executeWithRateLimit(
				() => this.client.get(endpoint),
				'getRecentBlocks'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getRecentBlocks');
		}
	}

	/**
	 * Get blocks starting from height (Phase 2)
	 * @param {number} startHeight - Start height
	 * @returns {Promise<Object>}
	 */
	async getBlocksFromHeight(startHeight) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/blocks/${startHeight}`),
				'getBlocksFromHeight'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getBlocksFromHeight');
		}
	}

	/**
	 * Get latest block hash (Phase 2)
	 * @returns {Promise<Object>}
	 */
	async getBlocksTipHash() {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get('/blocks/tip/hash'),
				'getBlocksTipHash'
			);
			return {
				success: true,
				hash: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getBlocksTipHash');
		}
	}

	// ========================================
	// Phase 2: Mempool Endpoints
	// ========================================

	/**
	 * Get recent mempool transactions (Phase 2)
	 * @returns {Promise<Object>}
	 */
	async getMempoolRecent() {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get('/mempool/recent'),
				'getMempoolRecent'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getMempoolRecent');
		}
	}

	/**
	 * Get all transaction IDs in mempool (Phase 2)
	 * @returns {Promise<Object>}
	 */
	async getMempoolTxids() {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get('/mempool/txids'),
				'getMempoolTxids'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getMempoolTxids');
		}
	}

	// ========================================
	// Phase 2: Fee Endpoints
	// ========================================

	/**
	 * Child-Pays-For-Parent fee suggestions (Phase 2)
	 * @returns {Promise<Object>}
	 */
	async getFeesCpfp() {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get('/v1/fees/cpfp'),
				'getFeesCpfp'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getFeesCpfp');
		}
	}

	// ========================================
	// Phase 2: Mining Endpoints
	// ========================================

	/**
	 * List of mining pools (Phase 2)
	 * @param {string} timeperiod - Optional timeperiod (e.g., '24h', '3d', '1w', '1m', '3m', '6m', '1y', '2y', '3y')
	 * @returns {Promise<Object>}
	 */
	async getMiningPools(timeperiod = null) {
		try {
			const endpoint = timeperiod ? `/mining/pools/${timeperiod}` : '/mining/pools';
			const response = await this._executeWithRateLimit(
				() => this.client.get(endpoint),
				'getMiningPools'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getMiningPools');
		}
	}

	/**
	 * Mining pools for specific timeperiod (Phase 2)
	 * @param {string} timeperiod - Timeperiod (e.g., '24h', '3d', '1w', '1m', '3m', '6m', '1y', '2y', '3y')
	 * @returns {Promise<Object>}
	 */
	async getMiningPoolsTimeperiod(timeperiod) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/mining/pools/${timeperiod}`),
				'getMiningPoolsTimeperiod'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getMiningPoolsTimeperiod');
		}
	}

	/**
	 * Specific mining pool information (Phase 2)
	 * @param {string} slug - Pool slug
	 * @returns {Promise<Object>}
	 */
	async getMiningPool(slug) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/mining/pool/${slug}`),
				'getMiningPool'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getMiningPool');
		}
	}

	/**
	 * Mining pool hashrate data (Phase 2)
	 * @param {string} slug - Pool slug
	 * @returns {Promise<Object>}
	 */
	async getMiningPoolHashrate(slug) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/mining/pool/${slug}/hashrate`),
				'getMiningPoolHashrate'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getMiningPoolHashrate');
		}
	}

	/**
	 * Blocks mined by specific pool (Phase 2)
	 * @param {string} slug - Pool slug
	 * @returns {Promise<Object>}
	 */
	async getMiningPoolBlocks(slug) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/mining/pool/${slug}/blocks`),
				'getMiningPoolBlocks'
			);
			return {
				success: true,
				data: response.data,
				count: response.data.length,
			};
		} catch (error) {
			return this.handleError(error, 'getMiningPoolBlocks');
		}
	}

	/**
	 * Network hashrate statistics (Phase 2)
	 * @returns {Promise<Object>}
	 */
	async getMiningHashrate() {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get('/mining/hashrate'),
				'getMiningHashrate'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getMiningHashrate');
		}
	}

	/**
	 * Difficulty adjustment history (Phase 2)
	 * @returns {Promise<Object>}
	 */
	async getMiningDifficulty() {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get('/mining/difficulty'),
				'getMiningDifficulty'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getMiningDifficulty');
		}
	}

	/**
	 * Fee details for specific block (Phase 2)
	 * @param {number} blockHeight - Block height
	 * @returns {Promise<Object>}
	 */
	async getMiningBlockFees(blockHeight) {
		try {
			const response = await this._executeWithRateLimit(
				() => this.client.get(`/v1/mining/blocks/fees/${blockHeight}`),
				'getMiningBlockFees'
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			return this.handleError(error, 'getMiningBlockFees');
		}
	}
}

// Export singleton instance
export const mempoolService = new MempoolService();
