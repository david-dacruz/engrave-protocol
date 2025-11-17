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
}

// Export singleton instance
export const mempoolService = new MempoolService();
