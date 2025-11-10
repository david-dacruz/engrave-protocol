// @ts-check
import {
	Connection,
	Keypair,
	Transaction,
	VersionedTransaction,
	clusterApiUrl,
} from '@solana/web3.js';
import axios from 'axios';
import nacl from 'tweetnacl';
import { withPaymentInterceptor } from 'x402-axios';
import { config } from '../config/env.js';

/**
 * HTTP Client Factory for MCP Server
 * Creates payment-enabled HTTP clients for x402 endpoints
 */

/**
 * Create Solana signer for x402 payments
 * @param {Keypair} keypair - Solana keypair for signing transactions
 * @param {Connection} connection - Solana connection
 * @returns {Object} Solana signer object for x402-axios
 */
export function createSolanaSigner(keypair, connection) {
	return {
		type: 'solana',
		network: config.x402.network,

		getAddress: async () => keypair.publicKey.toBase58(),

		sendTransaction: async (txData) => {
			const bytes = Buffer.from(txData.payload, 'base64');
			let sig;

			try {
				// Try as VersionedTransaction first
				const vtx = VersionedTransaction.deserialize(bytes);
				vtx.sign([keypair]);
				sig = await connection.sendTransaction(vtx);
			} catch {
				// Fallback to legacy Transaction
				const ltx = Transaction.from(bytes);
				sig = await connection.sendTransaction(ltx, [keypair]);
			}

			// Wait for confirmation
			await connection.confirmTransaction(sig, 'confirmed');
			return { hash: sig };
		},

		signMessage: async (message) => {
			const msgBytes =
				typeof message === 'string' ? Buffer.from(message) : message;
			const signature = nacl.sign.detached(msgBytes, keypair.secretKey);
			return Buffer.from(signature).toString('base64');
		},
	};
}

/**
 * Create payment-enabled HTTP client for MCP server
 * @param {Keypair} keypair - Solana keypair for payments
 * @param {string} [baseURL] - Base URL for API (defaults to config)
 * @returns {Object} Axios instance with x402 payment interceptor
 */
export function createPaymentEnabledClient(keypair, baseURL) {
	const apiBaseURL = baseURL || config.api.baseUrl;

	// Create Solana connection
	const connection = new Connection(
		clusterApiUrl('devnet'),
		'confirmed'
	);

	// Create Solana signer
	const solanaSigner = createSolanaSigner(keypair, connection);

	// Create axios client with x402 interceptor
	const client = withPaymentInterceptor(
		axios.create({ baseURL: apiBaseURL }),
		solanaSigner,
		(response) => response.data,
		{ defaultNetwork: config.x402.network }
	);

	console.log('[HTTP Client] Created payment-enabled client');
	console.log('[HTTP Client] Base URL:', apiBaseURL);
	console.log('[HTTP Client] Wallet:', keypair.publicKey.toBase58());
	console.log('[HTTP Client] Network:', config.x402.network);

	return client;
}

/**
 * Make a paid request to an x402 endpoint
 * @param {Object} client - Payment-enabled axios client
 * @param {string} endpoint - Endpoint path (e.g., '/api/inscribe')
 * @param {Object} [params] - Query parameters
 * @returns {Promise<Object>} Response data
 */
export async function makePaidRequest(client, endpoint, params = {}) {
	try {
		console.log('[HTTP Client] Making paid request to:', endpoint);
		console.log('[HTTP Client] Parameters:', params);

		const response = await client.get(endpoint, { params });

		console.log('[HTTP Client] ✅ Request successful');
		return response;
	} catch (error) {
		console.error('[HTTP Client] ❌ Request failed:', error.message);

		// Extract useful error information
		if (error.response) {
			throw new Error(
				`HTTP ${error.response.status}: ${
					error.response.data?.error || error.response.data?.message || 'Unknown error'
				}`
			);
		} else if (error.request) {
			throw new Error('No response received from server');
		} else {
			throw error;
		}
	}
}
