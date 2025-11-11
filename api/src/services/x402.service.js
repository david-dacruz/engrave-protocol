// @ts-check
import {X402PaymentHandler} from 'x402-solana/server';
import {config} from '../config/env.js';
import {directPaymentVerifier} from './direct-verifier.js';

/**
 * X402 Payment Service
 * Handles payment verification and settlement for x402 micropayments
 */

/**
 * @typedef {import('http').IncomingHttpHeaders} IncomingHttpHeaders
 */

/**
 * Payment header is a base64-encoded string containing payment proof
 * @typedef {string} PaymentHeader
 */

/**
 * @typedef {Object} PaymentRequirements
 * @property {string} scheme
 * @property {string} network
 * @property {string} maxAmountRequired
 * @property {string} resource
 * @property {string} description
 * @property {string} mimeType
 * @property {string} payTo
 * @property {number} maxTimeoutSeconds
 * @property {string} asset
 * @property {Object} outputSchema
 * @property {Object} extra
 */

/**
 * @typedef {Object} VerifyResponse
 * @property {boolean} isValid
 * @property {string} [invalidReason]
 */

/**
 * @typedef {Object} SettleResponse
 * @property {boolean} success
 * @property {string} [errorReason]
 * @property {string} transaction
 * @property {string} network
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

		/** @private */
		this.isDevelopment = config.nodeEnv === 'development';
	}

	/**
	 * Extract payment header from request
	 *
	 * @param {IncomingHttpHeaders} headers
	 * @returns {PaymentHeader | null}
	 */
	extractPayment(headers) {
		if (!headers || typeof headers !== 'object') {
			return null;
		}
		return this.handler.extractPayment(headers);
	}

	/**
	 * Create payment requirements for a resource
	 *
	 * @param {number} price
	 * @param {string} resource
	 * @param {string} [description]
	 * @returns {Promise<PaymentRequirements>}
	 * @throws {Error} If price is invalid or resource is empty
	 */
	async createPaymentRequirements(price, resource, description = 'API Request') {
		// Input validation
		if (typeof price !== 'number' || !isFinite(price) || price <= 0) {
			throw new Error(`Invalid price: ${price}. Price must be a positive number.`);
		}

		if (typeof resource !== 'string' || resource.trim().length === 0) {
			throw new Error('Invalid resource: resource must be a non-empty string.');
		}

		// Sanitize description to prevent log injection
		const sanitizedDescription = description.replace(/[\r\n]/g, ' ').substring(0, 200);

		const params = {
			price: {
				amount: price.toString(),
				asset: {
					address: config.x402.usdc.address,
				},
			},
			network: config.x402.network,
			config: {
				description: sanitizedDescription,
				resource: `${config.api.baseUrl}${resource}`,
			},
		};

		if (this.isDevelopment) {
			console.log('[X402] Creating payment requirements');
			console.log('[X402] Amount:', price, 'base units');
			console.log('[X402] Resource:', resource);
			console.log('[X402] Facilitator:', config.x402.facilitatorUrl);
		}

		try {
			const result = await this.handler.createPaymentRequirements(params);

			if (this.isDevelopment) {
				console.log('[X402] Payment requirements created successfully');
			}

			return result;
		} catch (error) {
			console.error('[X402] Error creating payment requirements:', error.message);
			throw new Error(`Failed to create payment requirements: ${error.message}`);
		}
	}

	/**
	 * Create 402 Payment Required response
	 *
	 * @param {PaymentRequirements} paymentRequirements
	 * @returns {PaymentRequiredResponse}
	 */
	create402Response(paymentRequirements) {
		if (!paymentRequirements || typeof paymentRequirements !== 'object') {
			throw new Error('Invalid payment requirements');
		}
		return this.handler.create402Response(paymentRequirements);
	}

	/**
	 * Verify payment against requirements
	 *
	 * @param {PaymentHeader} paymentHeader
	 * @param {PaymentRequirements} paymentRequirements
	 * @returns {Promise<VerifyResponse>}
	 * @throws {Error} If payment header is invalid
	 */
	async verifyPayment(paymentHeader, paymentRequirements) {
		// Validate inputs
		if (!paymentHeader || typeof paymentHeader !== 'string') {
			return {
				isValid: false,
				invalidReason: 'missing_payment_header',
			};
		}

		if (!paymentRequirements || typeof paymentRequirements !== 'object') {
			throw new Error('Invalid payment requirements');
		}

		// Basic validation: check if it looks like base64
		const base64Regex = /^[A-Za-z0-9+/]+=*$/;
		if (!base64Regex.test(paymentHeader)) {
			return {
				isValid: false,
				invalidReason: 'invalid_payment_header_format',
			};
		}

		if (this.isDevelopment) {
			console.log('[X402] Payment header received, length:', paymentHeader.length);

			// Only log payment structure in development, never the actual payload
			try {
				const decoded = Buffer.from(paymentHeader, 'base64').toString('utf8');
				const parsed = JSON.parse(decoded);
				console.log('[X402] Payment structure:', {
					x402Version: parsed.x402Version,
					network: parsed.network,
					scheme: parsed.scheme,
					hasPayload: !!parsed.payload,
					payloadLength: parsed.payload?.length || 0,
				});
			} catch (e) {
				console.error('[X402] Failed to parse payment header:', e.message);
			}
		}

		try {
			// Try facilitator first
			const result = await this.handler.verifyPayment(
				paymentHeader,
				paymentRequirements
			);

			// If facilitator fails with unexpected error, use direct verification
			if (!result.isValid && result.invalidReason === 'unexpected_verify_error') {
				console.log('[X402] Facilitator unavailable, using direct verification...');
				return await directPaymentVerifier.verifyPayment(paymentHeader, paymentRequirements);
			}

			if (this.isDevelopment) {
				console.log('[X402] Verification result:', result.isValid ? 'VALID' : 'INVALID');
				if (!result.isValid) {
					console.log('[X402] Verification failed reason:', result.invalidReason);
				}
			}

			return result;
		} catch (error) {
			console.error('[X402] Payment verification error:', error.message);
			// Fallback to direct verification on exception
			console.log('[X402] Falling back to direct verification...');
			return await directPaymentVerifier.verifyPayment(paymentHeader, paymentRequirements);
		}
	}

	/**
	 * Settle payment after successful request
	 *
	 * @param {PaymentHeader} paymentHeader
	 * @param {PaymentRequirements} paymentRequirements
	 * @returns {Promise<SettleResponse>}
	 * @throws {Error} If payment header is invalid
	 */
	async settlePayment(paymentHeader, paymentRequirements) {
		// Validate inputs
		if (!paymentHeader || typeof paymentHeader !== 'string') {
			return {
				success: false,
				errorReason: 'missing_payment_header',
				transaction: '',
				network: paymentRequirements?.network || 'unknown',
			};
		}

		if (!paymentRequirements || typeof paymentRequirements !== 'object') {
			throw new Error('Invalid payment requirements');
		}

		if (this.isDevelopment) {
			console.log('[X402] Attempting to settle payment');
		}

		try {
			// Try facilitator first
			const result = await this.handler.settlePayment(
				paymentHeader,
				paymentRequirements
			);

			// If facilitator fails, use direct settlement
			if (!result.success && result.errorReason === 'unexpected_settle_error') {
				console.log('[X402] Facilitator unavailable, using direct settlement...');
				return await directPaymentVerifier.settlePayment(paymentHeader, paymentRequirements);
			}

			if (this.isDevelopment) {
				console.log('[X402] Settlement result:', result.success ? 'SUCCESS' : 'FAILED');
				if (!result.success) {
					console.log('[X402] Settlement failed reason:', result.errorReason);
				}
			}

			return result;
		} catch (error) {
			console.error('[X402] Payment settlement error:', error.message);
			// Fallback to direct settlement on exception
			console.log('[X402] Falling back to direct settlement...');
			return await directPaymentVerifier.settlePayment(paymentHeader, paymentRequirements);
		}
	}
}

// Export singleton instance
export const x402Service = new X402Service();
