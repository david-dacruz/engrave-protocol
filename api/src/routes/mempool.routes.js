// @ts-check
/**
 * Mempool Routes (v1 - Production)
 *
 * This module contains production-ready endpoints for querying Bitcoin mempool data.
 * All routes are available at /api/v1/mempool/* and are fully tested and stable.
 *
 * Features:
 * - Bitcoin address information and transaction history
 * - Transaction details and confirmation status
 * - Block information
 * - Fee rate recommendations
 * - Mempool statistics
 *
 * All paid endpoints require x402 payment verification.
 */
import express from 'express';
import { mempoolService } from '../services/mempool.service.js';
import { x402Service } from '../services/x402.service.js';
import { getPrice } from '../config/pricing.js';

const router = express.Router();

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

/**
 * x402 Payment Middleware
 * Reusable payment verification middleware
 */
const verifyPayment = (price, resourcePath, description) => {
	return async (req, res, next) => {
		try {
			// Extract payment header
			const paymentHeader = x402Service.extractPayment(req.headers);

			// Create payment requirements
			const paymentRequirements = await x402Service.createPaymentRequirements(
				price,
				resourcePath,
				description
			);

			// If no payment, return 402
			if (!paymentHeader) {
				const response = x402Service.create402Response(paymentRequirements);
				return res.status(response.status).json(response.body);
			}

			// Verify payment
			const verified = await x402Service.verifyPayment(
				paymentHeader,
				paymentRequirements
			);

			if (!verified.isValid) {
				console.error('[MEMPOOL ROUTES] Payment verification failed:', verified.invalidReason);
				return res.status(402).json({
					error: 'Invalid payment',
					message: 'Payment verification failed',
					reason: verified.invalidReason,
				});
			}

			// Store payment info for settlement after response
			req.paymentHeader = paymentHeader;
			req.paymentRequirements = paymentRequirements;

			next();
		} catch (error) {
			console.error('[MEMPOOL ROUTES] Payment verification error:', error);
			return res.status(500).json({
				error: 'Payment verification error',
				message: error.message,
			});
		}
	};
};

/**
 * Generic Route Handler Factory
 * Eliminates boilerplate for service method calls with consistent error handling
 *
 * @param {Function} serviceMethod - The service method to call
 * @param {Function} extractParams - Function to extract parameters from req (req => params)
 * @param {Function} formatResponse - Function to format successful response (result, params) => response
 * @returns {Function} Express route handler
 */
const createHandler = (serviceMethod, extractParams, formatResponse) => {
	return async (req, res) => {
		const params = extractParams(req);
		const result = await serviceMethod(...params);

		if (!result.success) {
			return res.status(result.statusCode || 500).json({
				error: 'Query failed',
				message: result.error,
			});
		}

		return res.json(formatResponse(result, params));
	};
};

/**
 * Settlement Middleware
 * Settles payment after successful response
 */
const settlePayment = async (req, res, next) => {
	// Store original json method
	const originalJson = res.json.bind(res);

	// Override json method to settle payment after response
	res.json = function (data) {
		// Send response first
		originalJson(data);

		// Settle payment after response (async, don't await)
		if (req.paymentHeader && req.paymentRequirements) {
			x402Service.settlePayment(req.paymentHeader, req.paymentRequirements)
				.then((result) => {
					if (result.success) {
						console.log('[MEMPOOL] Payment settled successfully');
					} else {
						console.error('[MEMPOOL] Payment settlement failed:', result.errorReason);
					}
				})
				.catch(err => console.error('[MEMPOOL] Payment settlement error:', err));
		}

		return res;
	};

	next();
};

/**
 * @swagger
 * /api/mempool/address/{address}:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get Bitcoin address information
 *     description: "🔐 Retrieve detailed information about a Bitcoin address including balance and transaction history. **Cost: $0.10 USDC**"
 *     security:
 *       - x402: []
 *     parameters:
 *       - name: address
 *         in: path
 *         required: true
 *         description: Bitcoin address to query
 *         schema:
 *           type: string
 *           example: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
 *     responses:
 *       '200':
 *         description: Address information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MempoolAddressInfo'
 *       '402':
 *         description: Payment required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentRequired'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /api/mempool/address/:address
 * Get address information and balance
 * x402 protected - configurable pricing
 */
router.get('/address/:address',
	verifyPayment(getPrice('mempool', 'addressInfo'), '/api/mempool/address/:address', 'Bitcoin Address Query'),
	settlePayment,
	createHandler(
		mempoolService.getAddress.bind(mempoolService),
		(req) => [req.params.address],
		(result, [address]) => ({
			success: true,
			address,
			data: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * @swagger
 * /api/mempool/address/{address}/txs:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get address transactions
 *     description: "🔐 Retrieve all transactions for a Bitcoin address. **Cost: $0.25 USDC**"
 *     security:
 *       - x402: []
 *     parameters:
 *       - name: address
 *         in: path
 *         required: true
 *         description: Bitcoin address to query
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 address:
 *                   type: string
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: integer
 *                 network:
 *                   type: string
 *       '402':
 *         description: Payment required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentRequired'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /api/mempool/address/:address/txs
 * Get transactions for an address
 * x402 protected - configurable pricing
 */
router.get('/address/:address/txs',
	verifyPayment(getPrice('mempool', 'addressTxs'), '/api/mempool/address/:address/txs', 'Bitcoin Address Transactions'),
	settlePayment,
	createHandler(
		mempoolService.getAddressTransactions.bind(mempoolService),
		(req) => [req.params.address],
		(result, [address]) => ({
			success: true,
			address,
			transactions: result.data,
			count: result.count,
			network: mempoolService.network,
		})
	)
);

/**
 * @swagger
 * /api/mempool/tx/{txid}:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get transaction details
 *     description: "🔐 Retrieve detailed information about a specific Bitcoin transaction. **Cost: $0.10 USDC**"
 *     security:
 *       - x402: []
 *     parameters:
 *       - name: txid
 *         in: path
 *         required: true
 *         description: Bitcoin transaction ID (64-character hex string)
 *         schema:
 *           type: string
 *           example: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1"
 *     responses:
 *       '200':
 *         description: Transaction details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MempoolTransaction'
 *       '402':
 *         description: Payment required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentRequired'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /api/mempool/tx/:txid
 * Get transaction details
 * x402 protected - configurable pricing
 */
router.get('/tx/:txid',
	verifyPayment(getPrice('mempool', 'transaction'), '/api/mempool/tx/:txid', 'Bitcoin Transaction Query'),
	settlePayment,
	createHandler(
		mempoolService.getTransaction.bind(mempoolService),
		(req) => [req.params.txid],
		(result, [txid]) => ({
			success: true,
			txid,
			data: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * @swagger
 * /api/mempool/tx/{txid}/status:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get transaction confirmation status
 *     description: "🔐 Check the confirmation status of a Bitcoin transaction. **Cost: $0.05 USDC**"
 *     security:
 *       - x402: []
 *     parameters:
 *       - name: txid
 *         in: path
 *         required: true
 *         description: Bitcoin transaction ID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Transaction status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 txid:
 *                   type: string
 *                 status:
 *                   type: object
 *                   properties:
 *                     confirmed:
 *                       type: boolean
 *                     block_height:
 *                       type: integer
 *                     block_hash:
 *                       type: string
 *                     block_time:
 *                       type: integer
 *                 network:
 *                   type: string
 *       '402':
 *         description: Payment required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentRequired'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /api/mempool/tx/:txid/status
 * Get transaction confirmation status
 * x402 protected - configurable pricing
 */
router.get('/tx/:txid/status',
	verifyPayment(getPrice('mempool', 'txStatus'), '/api/mempool/tx/:txid/status', 'Transaction Status Query'),
	settlePayment,
	createHandler(
		mempoolService.getTransactionStatus.bind(mempoolService),
		(req) => [req.params.txid],
		(result, [txid]) => ({
			success: true,
			txid,
			status: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * @swagger
 * /api/mempool/block/{hash}:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get block information
 *     description: "🔐 Retrieve detailed information about a Bitcoin block. **Cost: $0.10 USDC**"
 *     security:
 *       - x402: []
 *     parameters:
 *       - name: hash
 *         in: path
 *         required: true
 *         description: Bitcoin block hash
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Block information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 blockHash:
 *                   type: string
 *                 data:
 *                   type: object
 *                 network:
 *                   type: string
 *       '402':
 *         description: Payment required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentRequired'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /api/mempool/block/:hash
 * Get block by hash
 * x402 protected - configurable pricing
 */
router.get('/block/:hash',
	verifyPayment(getPrice('mempool', 'block'), '/api/mempool/block/:hash', 'Bitcoin Block Query'),
	settlePayment,
	async (req, res) => {
		const { hash } = req.params;

		const result = await mempoolService.getBlock(hash);

		if (!result.success) {
			return res.status(result.statusCode || 500).json({
				error: 'Query failed',
				message: result.error,
			});
		}

		return res.json({
			success: true,
			blockHash: hash,
			data: result.data,
			network: mempoolService.network,
		});
	}
);

/**
 * @swagger
 * /api/mempool/fees:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get recommended Bitcoin fee rates
 *     description: "🔐 Get current Bitcoin network fee recommendations for different confirmation speeds. **Cost: $0.01 USDC** (micropayment)"
 *     security:
 *       - x402: []
 *     responses:
 *       '200':
 *         description: Fee rates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MempoolFees'
 *       '402':
 *         description: Payment required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentRequired'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /api/mempool/fees and /api/mempool/fees/:interval
 * Get recommended fee rates (interval parameter is accepted but not used by mempool.space API)
 * x402 protected - configurable pricing (micropayment!)
 */
router.get('/fees',
	verifyPayment(getPrice('mempool', 'fees'), '/api/mempool/fees', 'Bitcoin Fee Estimation'),
	settlePayment,
	async (req, res) => {
		const result = await mempoolService.getRecommendedFees();

		if (!result.success) {
			return res.status(result.statusCode || 500).json({
				error: 'Query failed',
				message: result.error,
			});
		}

		return res.json({
			success: true,
			fees: result.data,
			network: mempoolService.network,
			unit: 'sat/vB',
		});
	}
);

// Also accept optional interval parameter for API compatibility
router.get('/fees/:interval',
	verifyPayment(getPrice('mempool', 'fees'), '/api/mempool/fees/:interval', 'Bitcoin Fee Estimation'),
	settlePayment,
	async (req, res) => {
		// Note: mempool.space API doesn't use interval param, but we accept it for API compatibility
		const result = await mempoolService.getRecommendedFees();

		if (!result.success) {
			return res.status(result.statusCode || 500).json({
				error: 'Query failed',
				message: result.error,
			});
		}

		return res.json({
			success: true,
			interval: req.params.interval || 'current',
			fees: result.data,
			network: mempoolService.network,
			unit: 'sat/vB',
		});
	}
);

/**
 * @swagger
 * /api/mempool/stats:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get mempool statistics
 *     description: "🔐 Get current Bitcoin mempool statistics including size, fees, and transaction counts. **Cost: $0.01 USDC** (micropayment)"
 *     security:
 *       - x402: []
 *     responses:
 *       '200':
 *         description: Mempool statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   description: Mempool statistics from Mempool.io
 *                 network:
 *                   type: string
 *       '402':
 *         description: Payment required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentRequired'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /api/mempool/stats
 * Get current mempool statistics
 * x402 protected - configurable pricing (micropayment!)
 */
router.get('/stats',
	verifyPayment(getPrice('mempool', 'stats'), '/api/mempool/stats', 'Mempool Statistics'),
	settlePayment,
	async (req, res) => {
		const result = await mempoolService.getMempoolStats();

		if (!result.success) {
			return res.status(result.statusCode || 500).json({
				error: 'Query failed',
				message: result.error,
			});
		}

		return res.json({
			success: true,
			stats: result.data,
			network: mempoolService.network,
		});
	}
);

/**
 * @swagger
 * /api/mempool/height:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get current Bitcoin block height
 *     description: "Get the current Bitcoin block height. **FREE - No payment required**"
 *     responses:
 *       '200':
 *         description: Block height retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 height:
 *                   type: integer
 *                   description: Current block height
 *                 network:
 *                   type: string
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /api/mempool/height
 * Get current block height (FREE - no x402)
 */
router.get('/height', async (req, res) => {
	const result = await mempoolService.getBlockHeight();

	if (!result.success) {
		return res.status(500).json({
			error: 'Query failed',
			message: result.error,
		});
	}

	return res.json({
		success: true,
		height: result.height,
		network: mempoolService.network,
	});
});

export default router;
