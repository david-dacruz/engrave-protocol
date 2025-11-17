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

/**
 * @swagger
 * /api/mempool/fees/{interval}:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get recommended Bitcoin fee rates (with interval)
 *     description: "🔐 Get current Bitcoin network fee recommendations. Interval parameter accepted for API compatibility. **Cost: $0.01 USDC** (micropayment)"
 *     security:
 *       - x402: []
 *     parameters:
 *       - name: interval
 *         in: path
 *         required: true
 *         description: Time interval (accepted for compatibility but not used)
 *         schema:
 *           type: string
 *           example: next
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
 * GET /api/mempool/fees/:interval
 * Also accept optional interval parameter for API compatibility
 * x402 protected - configurable pricing (micropayment!)
 */
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

/**
 * @swagger
 * /api/mempool/address/{address}/utxo:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get address UTXOs
 *     description: "🔐 Retrieve unspent transaction outputs for a Bitcoin address. **Cost: $0.05 USDC**"
 *     security:
 *       - x402: []
 *     parameters:
 *       - name: address
 *         in: path
 *         required: true
 *         description: Bitcoin address
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: UTXOs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MempoolAddressUtxo'
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
 * GET /api/mempool/address/:address/utxo
 * Get UTXOs for an address (Phase 1)
 * x402 protected
 */
router.get('/address/:address/utxo',
	verifyPayment(getPrice('mempool', 'addressUtxo'), '/api/mempool/address/:address/utxo', 'Bitcoin Address UTXO Query'),
	settlePayment,
	createHandler(
		mempoolService.getAddressUtxo.bind(mempoolService),
		(req) => [req.params.address],
		(result, [address]) => ({
			success: true,
			address,
			utxos: result.data,
			count: result.count,
			network: mempoolService.network,
		})
	)
);

/**
 * @swagger
 * /api/mempool/address/{address}/txs/mempool:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get unconfirmed address transactions
 *     description: "🔐 Retrieve unconfirmed transactions for a Bitcoin address. **Cost: $0.02 USDC** (micropayment)"
 *     security:
 *       - x402: []
 *     parameters:
 *       - name: address
 *         in: path
 *         required: true
 *         description: Bitcoin address
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Mempool transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MempoolAddressMempoolTxs'
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
 * GET /api/mempool/address/:address/txs/mempool
 * Get unconfirmed transactions for an address (Phase 1)
 * x402 protected - micropayment
 */
router.get('/address/:address/txs/mempool',
	verifyPayment(getPrice('mempool', 'addressTxsMempool'), '/api/mempool/address/:address/txs/mempool', 'Bitcoin Address Mempool Transactions'),
	settlePayment,
	createHandler(
		mempoolService.getAddressMempoolTxs.bind(mempoolService),
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
 * /api/mempool/tx/{txid}/hex:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get raw transaction hex
 *     description: "🔐 Retrieve raw transaction data in hex format. **Cost: $0.03 USDC**"
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
 *         description: Transaction hex retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MempoolTransactionHex'
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
 * GET /api/mempool/tx/:txid/hex
 * Get raw transaction hex (Phase 1)
 * x402 protected
 */
router.get('/tx/:txid/hex',
	verifyPayment(getPrice('mempool', 'txHex'), '/api/mempool/tx/:txid/hex', 'Bitcoin Transaction Hex Query'),
	settlePayment,
	createHandler(
		mempoolService.getTransactionHex.bind(mempoolService),
		(req) => [req.params.txid],
		(result, [txid]) => ({
			success: true,
			txid,
			hex: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * @swagger
 * /api/mempool/tx/{txid}/outspends:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get transaction output spend status
 *     description: "🔐 Check if transaction outputs have been spent. **Cost: $0.05 USDC**"
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
 *         description: Output spend status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MempoolTransactionOutspends'
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
 * GET /api/mempool/tx/:txid/outspends
 * Get transaction output spend status (Phase 1)
 * x402 protected
 */
router.get('/tx/:txid/outspends',
	verifyPayment(getPrice('mempool', 'txOutspends'), '/api/mempool/tx/:txid/outspends', 'Bitcoin Transaction Outspends Query'),
	settlePayment,
	createHandler(
		mempoolService.getTransactionOutspends.bind(mempoolService),
		(req) => [req.params.txid],
		(result, [txid]) => ({
			success: true,
			txid,
			outspends: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * @swagger
 * /api/mempool/block/{hash}/txs:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get block transactions
 *     description: "🔐 Retrieve all transactions in a block. **Cost: $0.15 USDC**"
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
 *         description: Block transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MempoolBlockTransactions'
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
 * GET /api/mempool/block/:hash/txs
 * Get block transactions (Phase 1)
 * x402 protected
 */
router.get('/block/:hash/txs',
	verifyPayment(getPrice('mempool', 'blockTxs'), '/api/mempool/block/:hash/txs', 'Bitcoin Block Transactions Query'),
	settlePayment,
	createHandler(
		mempoolService.getBlockTransactions.bind(mempoolService),
		(req) => [req.params.hash],
		(result, [hash]) => ({
			success: true,
			blockHash: hash,
			transactions: result.data,
			count: result.count,
			network: mempoolService.network,
		})
	)
);

/**
 * @swagger
 * /api/mempool/block-height/{height}:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get block by height
 *     description: "🔐 Retrieve block information by block height. **Cost: $0.05 USDC**"
 *     security:
 *       - x402: []
 *     parameters:
 *       - name: height
 *         in: path
 *         required: true
 *         description: Block height number
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Block retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MempoolBlockByHeight'
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
 * GET /api/mempool/block-height/:height
 * Get block by height (Phase 1)
 * x402 protected
 */
router.get('/block-height/:height',
	verifyPayment(getPrice('mempool', 'blockHeight'), '/api/mempool/block-height/:height', 'Bitcoin Block Height Query'),
	settlePayment,
	createHandler(
		mempoolService.getBlockByHeight.bind(mempoolService),
		(req) => [req.params.height],
		(result, [height]) => ({
			success: true,
			height: parseInt(height),
			data: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * @swagger
 * /api/mempool/fees/mempool-blocks:
 *   get:
 *     tags:
 *       - Mempool
 *     summary: Get projected mempool blocks
 *     description: "🔐 Get projected mempool blocks with fee information. **Cost: $0.02 USDC** (micropayment)"
 *     security:
 *       - x402: []
 *     responses:
 *       '200':
 *         description: Mempool blocks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MempoolProjectedBlocks'
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
 * GET /api/mempool/fees/mempool-blocks
 * Get projected mempool blocks (Phase 1)
 * x402 protected - micropayment
 */
router.get('/fees/mempool-blocks',
	verifyPayment(getPrice('mempool', 'mempoolBlocks'), '/api/mempool/fees/mempool-blocks', 'Mempool Blocks Projection'),
	settlePayment,
	createHandler(
		mempoolService.getMempoolBlocks.bind(mempoolService),
		() => [],
		(result) => ({
			success: true,
			blocks: result.data,
			network: mempoolService.network,
		})
	)
);

// ========================================
// Phase 2: Address Endpoints
// ========================================

/**
 * GET /api/mempool/address/:address/txs/chain
 * Get confirmed transaction history only
 */
router.get('/address/:address/txs/chain',
	verifyPayment(getPrice('mempool', 'addressTxsChain'), '/api/mempool/address/:address/txs/chain', 'Confirmed Transaction History'),
	settlePayment,
	createHandler(
		mempoolService.getAddressTxsChain.bind(mempoolService),
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
 * GET /api/mempool/address/:address/txs/chain/:txid
 * Get confirmed transaction history from specific transaction
 */
router.get('/address/:address/txs/chain/:txid',
	verifyPayment(getPrice('mempool', 'addressTxsChainFrom'), '/api/mempool/address/:address/txs/chain/:txid', 'Transaction History From TXID'),
	settlePayment,
	createHandler(
		mempoolService.getAddressTxsChainFrom.bind(mempoolService),
		(req) => [req.params.address, req.params.txid],
		(result, [address, txid]) => ({
			success: true,
			address,
			fromTxid: txid,
			transactions: result.data,
			count: result.count,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/address-prefix/:prefix
 * Search addresses by prefix
 */
router.get('/address-prefix/:prefix',
	verifyPayment(getPrice('mempool', 'addressPrefix'), '/api/mempool/address-prefix/:prefix', 'Address Prefix Search'),
	settlePayment,
	createHandler(
		mempoolService.getAddressByPrefix.bind(mempoolService),
		(req) => [req.params.prefix],
		(result, [prefix]) => ({
			success: true,
			prefix,
			data: result.data,
			network: mempoolService.network,
		})
	)
);

// ========================================
// Phase 2: Transaction Endpoints
// ========================================

/**
 * GET /api/mempool/tx/:txid/merkle-proof
 * Get merkle inclusion proof for transaction
 */
router.get('/tx/:txid/merkle-proof',
	verifyPayment(getPrice('mempool', 'txMerkleProof'), '/api/mempool/tx/:txid/merkle-proof', 'Merkle Proof'),
	settlePayment,
	createHandler(
		mempoolService.getTransactionMerkleProof.bind(mempoolService),
		(req) => [req.params.txid],
		(result, [txid]) => ({
			success: true,
			txid,
			proof: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/tx/:txid/merkleblock-proof
 * Get merkleblock proof for transaction
 */
router.get('/tx/:txid/merkleblock-proof',
	verifyPayment(getPrice('mempool', 'txMerkleblockProof'), '/api/mempool/tx/:txid/merkleblock-proof', 'Merkleblock Proof'),
	settlePayment,
	createHandler(
		mempoolService.getTransactionMerkleblockProof.bind(mempoolService),
		(req) => [req.params.txid],
		(result, [txid]) => ({
			success: true,
			txid,
			proof: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/tx/:txid/outspend/:vout
 * Check if specific transaction output is spent
 */
router.get('/tx/:txid/outspend/:vout',
	verifyPayment(getPrice('mempool', 'txOutspendSingle'), '/api/mempool/tx/:txid/outspend/:vout', 'Output Spend Status'),
	settlePayment,
	createHandler(
		mempoolService.getTransactionOutspendSingle.bind(mempoolService),
		(req) => [req.params.txid, parseInt(req.params.vout)],
		(result, [txid, vout]) => ({
			success: true,
			txid,
			vout,
			spent: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/tx/:txid/raw
 * Get raw transaction in binary format
 */
router.get('/tx/:txid/raw',
	verifyPayment(getPrice('mempool', 'txRaw'), '/api/mempool/tx/:txid/raw', 'Raw Transaction'),
	settlePayment,
	createHandler(
		mempoolService.getTransactionRaw.bind(mempoolService),
		(req) => [req.params.txid],
		(result, [txid]) => ({
			success: true,
			txid,
			raw: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/txs/recent
 * Get recent transactions
 */
router.get('/txs/recent',
	verifyPayment(getPrice('mempool', 'txsRecent'), '/api/mempool/txs/recent', 'Recent Transactions'),
	settlePayment,
	createHandler(
		mempoolService.getRecentTransactions.bind(mempoolService),
		() => [],
		(result) => ({
			success: true,
			transactions: result.data,
			count: result.count,
			network: mempoolService.network,
		})
	)
);

// ========================================
// Phase 2: Block Endpoints
// ========================================

/**
 * GET /api/mempool/block/:hash/header
 * Get block header only
 */
router.get('/block/:hash/header',
	verifyPayment(getPrice('mempool', 'blockHeader'), '/api/mempool/block/:hash/header', 'Block Header'),
	settlePayment,
	createHandler(
		mempoolService.getBlockHeader.bind(mempoolService),
		(req) => [req.params.hash],
		(result, [hash]) => ({
			success: true,
			hash,
			header: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/block/:hash/raw
 * Get raw block in binary format
 */
router.get('/block/:hash/raw',
	verifyPayment(getPrice('mempool', 'blockRaw'), '/api/mempool/block/:hash/raw', 'Raw Block'),
	settlePayment,
	createHandler(
		mempoolService.getBlockRaw.bind(mempoolService),
		(req) => [req.params.hash],
		(result, [hash]) => ({
			success: true,
			hash,
			raw: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/block/:hash/status
 * Get block confirmation status
 */
router.get('/block/:hash/status',
	verifyPayment(getPrice('mempool', 'blockStatus'), '/api/mempool/block/:hash/status', 'Block Status'),
	settlePayment,
	createHandler(
		mempoolService.getBlockStatus.bind(mempoolService),
		(req) => [req.params.hash],
		(result, [hash]) => ({
			success: true,
			hash,
			status: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/block/:hash/txs/:index
 * Get specific transaction by index in block
 */
router.get('/block/:hash/txs/:index',
	verifyPayment(getPrice('mempool', 'blockTxByIndex'), '/api/mempool/block/:hash/txs/:index', 'Block Transaction by Index'),
	settlePayment,
	createHandler(
		mempoolService.getBlockTxByIndex.bind(mempoolService),
		(req) => [req.params.hash, parseInt(req.params.index)],
		(result, [hash, index]) => ({
			success: true,
			hash,
			index,
			transaction: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/block/:hash/txids
 * Get all transaction IDs in a block
 */
router.get('/block/:hash/txids',
	verifyPayment(getPrice('mempool', 'blockTxids'), '/api/mempool/block/:hash/txids', 'Block Transaction IDs'),
	settlePayment,
	createHandler(
		mempoolService.getBlockTxids.bind(mempoolService),
		(req) => [req.params.hash],
		(result, [hash]) => ({
			success: true,
			hash,
			txids: result.data,
			count: result.count,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/blocks
 * Get recent blocks
 */
router.get('/blocks',
	verifyPayment(getPrice('mempool', 'blocks'), '/api/mempool/blocks', 'Recent Blocks'),
	settlePayment,
	createHandler(
		mempoolService.getRecentBlocks.bind(mempoolService),
		() => [null],
		(result) => ({
			success: true,
			blocks: result.data,
			count: result.count,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/blocks/:startHeight
 * Get blocks starting from height
 */
router.get('/blocks/:startHeight',
	verifyPayment(getPrice('mempool', 'blocksFromHeight'), '/api/mempool/blocks/:startHeight', 'Blocks From Height'),
	settlePayment,
	createHandler(
		mempoolService.getBlocksFromHeight.bind(mempoolService),
		(req) => [parseInt(req.params.startHeight)],
		(result, [startHeight]) => ({
			success: true,
			startHeight,
			blocks: result.data,
			count: result.count,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/blocks/tip/hash
 * Get latest block hash (FREE)
 */
router.get('/blocks/tip/hash',
	createHandler(
		mempoolService.getBlocksTipHash.bind(mempoolService),
		() => [],
		(result) => ({
			success: true,
			hash: result.hash,
			network: mempoolService.network,
		})
	)
);

// ========================================
// Phase 2: Mempool Endpoints
// ========================================

/**
 * GET /api/mempool/recent
 * Get recent mempool transactions
 */
router.get('/mempool/recent',
	verifyPayment(getPrice('mempool', 'mempoolRecent'), '/api/mempool/mempool/recent', 'Recent Mempool Transactions'),
	settlePayment,
	createHandler(
		mempoolService.getMempoolRecent.bind(mempoolService),
		() => [],
		(result) => ({
			success: true,
			transactions: result.data,
			count: result.count,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/txids
 * Get all transaction IDs in mempool
 */
router.get('/mempool/txids',
	verifyPayment(getPrice('mempool', 'mempoolTxids'), '/api/mempool/mempool/txids', 'Mempool Transaction IDs'),
	settlePayment,
	createHandler(
		mempoolService.getMempoolTxids.bind(mempoolService),
		() => [],
		(result) => ({
			success: true,
			txids: result.data,
			count: result.count,
			network: mempoolService.network,
		})
	)
);

// ========================================
// Phase 2: Fee Endpoints
// ========================================

/**
 * GET /api/mempool/v1/fees/cpfp
 * Child-Pays-For-Parent fee suggestions
 */
router.get('/v1/fees/cpfp',
	verifyPayment(getPrice('mempool', 'feesCpfp'), '/api/mempool/v1/fees/cpfp', 'CPFP Fee Suggestions'),
	settlePayment,
	createHandler(
		mempoolService.getFeesCpfp.bind(mempoolService),
		() => [],
		(result) => ({
			success: true,
			fees: result.data,
			network: mempoolService.network,
		})
	)
);

// ========================================
// Phase 2: Mining Endpoints
// ========================================

/**
 * GET /api/mempool/mining/pools
 * List of all mining pools
 */
router.get('/mining/pools',
	verifyPayment(getPrice('mempool', 'miningPools'), '/api/mempool/mining/pools', 'Mining Pools'),
	settlePayment,
	createHandler(
		mempoolService.getMiningPools.bind(mempoolService),
		() => [null],
		(result) => ({
			success: true,
			timeperiod: 'all',
			pools: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/mining/pools/:timeperiod
 * Mining pools for specific timeperiod
 */
router.get('/mining/pools/:timeperiod',
	verifyPayment(getPrice('mempool', 'miningPoolsTimeperiod'), '/api/mempool/mining/pools/:timeperiod', 'Mining Pools by Timeperiod'),
	settlePayment,
	createHandler(
		mempoolService.getMiningPoolsTimeperiod.bind(mempoolService),
		(req) => [req.params.timeperiod],
		(result, [timeperiod]) => ({
			success: true,
			timeperiod,
			pools: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/mining/pool/:slug
 * Specific mining pool information
 */
router.get('/mining/pool/:slug',
	verifyPayment(getPrice('mempool', 'miningPool'), '/api/mempool/mining/pool/:slug', 'Mining Pool Info'),
	settlePayment,
	createHandler(
		mempoolService.getMiningPool.bind(mempoolService),
		(req) => [req.params.slug],
		(result, [slug]) => ({
			success: true,
			slug,
			pool: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/mining/pool/:slug/hashrate
 * Mining pool hashrate data
 */
router.get('/mining/pool/:slug/hashrate',
	verifyPayment(getPrice('mempool', 'miningPoolHashrate'), '/api/mempool/mining/pool/:slug/hashrate', 'Pool Hashrate'),
	settlePayment,
	createHandler(
		mempoolService.getMiningPoolHashrate.bind(mempoolService),
		(req) => [req.params.slug],
		(result, [slug]) => ({
			success: true,
			slug,
			hashrate: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/mining/pool/:slug/blocks
 * Blocks mined by specific pool
 */
router.get('/mining/pool/:slug/blocks',
	verifyPayment(getPrice('mempool', 'miningPoolBlocks'), '/api/mempool/mining/pool/:slug/blocks', 'Pool Blocks'),
	settlePayment,
	createHandler(
		mempoolService.getMiningPoolBlocks.bind(mempoolService),
		(req) => [req.params.slug],
		(result, [slug]) => ({
			success: true,
			slug,
			blocks: result.data,
			count: result.count,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/mining/hashrate
 * Network hashrate statistics
 */
router.get('/mining/hashrate',
	verifyPayment(getPrice('mempool', 'miningHashrate'), '/api/mempool/mining/hashrate', 'Network Hashrate'),
	settlePayment,
	createHandler(
		mempoolService.getMiningHashrate.bind(mempoolService),
		() => [],
		(result) => ({
			success: true,
			hashrate: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/mining/difficulty
 * Difficulty adjustment history
 */
router.get('/mining/difficulty',
	verifyPayment(getPrice('mempool', 'miningDifficulty'), '/api/mempool/mining/difficulty', 'Difficulty History'),
	settlePayment,
	createHandler(
		mempoolService.getMiningDifficulty.bind(mempoolService),
		() => [],
		(result) => ({
			success: true,
			difficulty: result.data,
			network: mempoolService.network,
		})
	)
);

/**
 * GET /api/mempool/v1/mining/blocks/fees/:blockHeight
 * Fee details for specific block
 */
router.get('/v1/mining/blocks/fees/:blockHeight',
	verifyPayment(getPrice('mempool', 'miningBlockFees'), '/api/mempool/v1/mining/blocks/fees/:blockHeight', 'Block Fee Details'),
	settlePayment,
	createHandler(
		mempoolService.getMiningBlockFees.bind(mempoolService),
		(req) => [parseInt(req.params.blockHeight)],
		(result, [blockHeight]) => ({
			success: true,
			blockHeight,
			fees: result.data,
			network: mempoolService.network,
		})
	)
);

export default router;
