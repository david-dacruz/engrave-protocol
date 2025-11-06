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
		return await this.handler.createPaymentRequirements({
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
		});
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
