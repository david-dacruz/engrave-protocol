// @ts-check
import {X402PaymentHandler} from 'x402-solana/server';
import {config} from '../config/env.js';

/**
 * X402 Payment Service
 * Handles payment verification and settlement for x402 micropayments
 */

/**
 * @typedef {import('http').IncomingHttpHeaders} IncomingHttpHeaders
 */

/**
 * @typedef {Record<string, unknown>} PaymentHeader
 */

/**
 * @typedef {Record<string, unknown>} PaymentRequirements
 */

/**
 * @typedef {{status: number, body: Record<string, unknown>}} PaymentRequiredResponse
 */

class X402Service {
	constructor() {
		/** @private */
		this.handler = new X402PaymentHandler({
			network: config.x402.network,
			treasuryAddress: config.treasury.walletAddress,
			facilitatorUrl: config.x402.facilitatorUrl,
		});
	}

	/**
	 * Extract payment header from request
	 *
	 * @param {IncomingHttpHeaders} headers
	 * @returns {PaymentHeader | undefined}
	 */
	extractPayment(headers) {
		return this.handler.extractPayment(headers);
	}

	/**
	 * Create payment requirements for a resource
	 *
	 * @param {number} price
	 * @param {string} resource
	 * @param {string} [description]
	 * @returns {Promise<PaymentRequirements>}
	 */
	async createPaymentRequirements(price, resource, description = 'API Request') {
		const params = {
			price: {
				amount: price.toString(),
				asset: {
					address: config.x402.usdc.address,
				},
			},
			network: config.x402.network,
			config: {
				description,
				resource: `${config.api.baseUrl}${resource}`,
			},
		};

		console.log('[X402] Creating payment requirements:', JSON.stringify(params, null, 2));
		console.log('[X402] Facilitator URL:', config.x402.facilitatorUrl);

		try {
			const result = await this.handler.createPaymentRequirements(params);
			console.log('[X402] Payment requirements created successfully');
			return result;
		} catch (error) {
			console.error('[X402] Error creating payment requirements:', error);
			throw error;
		}
	}

	/**
	 * Create 402 Payment Required response
	 *
	 * @param {PaymentRequirements} paymentRequirements
	 * @returns {PaymentRequiredResponse}
	 */
	create402Response(paymentRequirements) {
		return this.handler.create402Response(paymentRequirements);
	}

	/**
	 * Verify payment against requirements
	 *
	 * @param {PaymentHeader} paymentHeader
	 * @param {PaymentRequirements} paymentRequirements
	 * @returns {Promise<boolean>}
	 */
	async verifyPayment(paymentHeader, paymentRequirements) {
		console.log('[X402] Payment header received (first 50 chars):', paymentHeader?.substring(0, 50));
		console.log('[X402] Payment header length:', paymentHeader?.length);

		// Verify it's valid base64
		try {
			const decoded = Buffer.from(paymentHeader, 'base64').toString('utf8');
			console.log('[X402] Decoded payment (first 100 chars):', decoded.substring(0, 100));
			const parsed = JSON.parse(decoded);
			console.log('[X402] Parsed payment:', JSON.stringify(parsed, null, 2));
		} catch (e) {
			console.error('[X402] Failed to decode/parse payment header:', e.message);
		}

		return await this.handler.verifyPayment(
			paymentHeader,
			paymentRequirements
		);
	}

	/**
	 * Settle payment after successful request
	 *
	 * @param {PaymentHeader} paymentHeader
	 * @param {PaymentRequirements} paymentRequirements
	 * @returns {Promise<void>}
	 */
	async settlePayment(paymentHeader, paymentRequirements) {
		return await this.handler.settlePayment(
			paymentHeader,
			paymentRequirements
		);
	}
}

// Export singleton instance
export const x402Service = new X402Service();
