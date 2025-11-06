// @ts-check
import express from 'express';
import {x402Service} from '../services/x402.service.js';
import {agentService} from '../services/agent.service.js';

const router = express.Router();

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

/**
 * GET /api/inscribe
 * x402 payment-protected endpoint for Bitcoin Ordinals inscriptions
 */
/** @type {import('express').RequestHandler} */
const inscribeHandler = async (req, res) => {
	try {
		// Extract payment header from request
		const paymentHeader = x402Service.extractPayment(req.headers);

		// Create payment requirements: $1.00 USDC
		const paymentRequirements = await x402Service.createPaymentRequirements(
			1000000, // $1.00 in USDC (6 decimals)
			'/api/inscribe',
			'Bitcoin Ordinals Inscription'
		);

		// If no payment header, return 402 Payment Required
		if (!paymentHeader) {
			const response = x402Service.create402Response(paymentRequirements);
			return res.status(response.status).json(response.body);
		}

		// Verify the payment
		const verified = await x402Service.verifyPayment(
			paymentHeader,
			paymentRequirements
		);

		if (!verified) {
			return res.status(402).json({
				error: 'Invalid payment',
				message: 'Payment verification failed',
			});
		}

		// Process the AI agent task (inscription)
		const result = await agentService.processInscriptionRequest(req.body);

		// Settle the payment
		await x402Service.settlePayment(paymentHeader, paymentRequirements);

		// Return success response
		return res.json(result);
	} catch (error) {
		console.error('Error handling inscribe endpoint:', error);
		return res.status(500).json({
			error: 'Internal server error',
			message: error.message,
		});
	}
};

router.get('/inscribe', inscribeHandler);

export default router;
