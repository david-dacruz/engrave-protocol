// @ts-check
import {
	Connection,
	Keypair,
	PublicKey,
	SystemProgram,
	Transaction,
	clusterApiUrl,
} from '@solana/web3.js';
import {
	createTransferInstruction,
	getAssociatedTokenAddress,
} from '@solana/spl-token';
import { config } from '../config/env.js';

/**
 * HTTP Client Factory for MCP Server
 * Creates payment-enabled HTTP clients for x402 endpoints
 * Node.js-compatible implementation using manual x402 protocol
 */

/**
 * Create wallet adapter for x402-solana from Keypair
 * @param {Keypair} keypair - Solana keypair
 * @returns {Object} WalletAdapter interface
 */
export function createWalletAdapter(keypair) {
	return {
		publicKey: keypair.publicKey,
		signTransaction: async (tx) => {
			tx.sign([keypair]);
			return tx;
		},
	};
}

/**
 * Create Solana signer for x402 payments (for test compatibility)
 * @param {Keypair} keypair - Solana keypair for signing transactions
 * @param {Connection} connection - Solana connection (unused but kept for API compatibility)
 * @returns {Object} Wallet adapter
 */
export function createSolanaSigner(keypair, connection) {
	return createWalletAdapter(keypair);
}

/**
 * Build Solana payment transaction from x402 requirements
 * @param {Object} paymentRequirements - Payment requirements from 402 response
 * @param {Keypair} keypair - Payer keypair
 * @param {Connection} connection - Solana connection
 * @returns {Promise<Transaction>} Signed transaction
 */
async function buildPaymentTransaction(
	paymentRequirements,
	keypair,
	connection
) {
	const payTo = new PublicKey(paymentRequirements.payTo);
	const asset = new PublicKey(paymentRequirements.asset);
	const amount = BigInt(paymentRequirements.maxAmountRequired);

	// Get associated token addresses
	const fromAta = await getAssociatedTokenAddress(asset, keypair.publicKey);
	const toAta = await getAssociatedTokenAddress(asset, payTo);

	//Check if destination token account exists
	try {
		await connection.getAccountInfo(toAta);
	} catch (error) {
		throw new Error(
			`Treasury token account does not exist. Treasury needs to initialize token account for ${asset.toBase58()}`
		);
	}

	// Create transfer instruction
	const transferIx = createTransferInstruction(
		fromAta,
		toAta,
		keypair.publicKey,
		amount
	);

	// Build transaction
	const { blockhash, lastValidBlockHeight } =
		await connection.getLatestBlockhash();
	const tx = new Transaction();
	tx.recentBlockhash = blockhash;
	tx.lastValidBlockHeight = lastValidBlockHeight;
	tx.feePayer = keypair.publicKey;

	// Add fee payer instruction if specified
	if (paymentRequirements.extra?.feePayer) {
		const feePayer = new PublicKey(paymentRequirements.extra.feePayer);
		const feePayerIx = SystemProgram.transfer({
			fromPubkey: keypair.publicKey,
			toPubkey: feePayer,
			lamports: 5000, // Minimal SOL for tx fee
		});
		tx.add(feePayerIx);
	}

	tx.add(transferIx);

	// Don't sign yet - caller will simulate first, then sign
	return tx;
}

/**
 * Create payment-enabled HTTP client for MCP server
 * @param {Keypair} keypair - Solana keypair for payments
 * @param {string} [baseURL] - Base URL for API (defaults to config)
 * @returns {Object} Payment-enabled client with fetch API
 */
export function createPaymentEnabledClient(keypair, baseURL) {
	const apiBaseURL = baseURL || config.api.baseUrl;
	const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

	console.log('[HTTP Client] Created payment-enabled client');
	console.log('[HTTP Client] Base URL:', apiBaseURL);
	console.log('[HTTP Client] Wallet:', keypair.publicKey.toBase58());
	console.log('[HTTP Client] Network:', config.x402.network);

	/**
	 * Make a fetch request with automatic x402 payment handling
	 * @param {string} url - Full URL
	 * @param {Object} [options] - Fetch options
	 * @returns {Promise<Response>} Fetch response
	 */
	async function paymentFetch(url, options = {}) {
		// Make initial request
		let response = await fetch(url, options);

		// If not 402, return as-is
		if (response.status !== 402) {
			return response;
		}

		console.log('[HTTP Client] Received 402, processing payment...');

		// Parse payment requirements
		const x402Response = await response.json();
		const paymentRequirements = x402Response.accepts?.[0];

		if (!paymentRequirements) {
			throw new Error('No payment requirements found in 402 response');
		}

		// Build payment transaction
		const tx = await buildPaymentTransaction(
			paymentRequirements,
			keypair,
			connection
		);

		// CRITICAL: Simulate transaction before signing (x402 spec requirement)
		try {
			const simulation = await connection.simulateTransaction(tx);
			if (simulation.value.err) {
				throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
			}
			console.log('[HTTP Client] Transaction simulation successful');
		} catch (error) {
			console.error('[HTTP Client] Transaction simulation failed:', error.message);
			throw new Error(`Cannot proceed with payment: ${error.message}`);
		}

		// Sign transaction after simulation passes
		tx.sign(keypair);

		// Serialize transaction
		const serializedTx = tx.serialize().toString('base64');

		// Create payment payload object (x402-solana library structure)
		// Note: Using library structure for facilitator compatibility
		const paymentPayload = {
			x402Version: x402Response.x402Version || 1,
			network: paymentRequirements.network,
			payload: serializedTx,
			scheme: 'exact',
		};

		// Encode payment payload as base64-encoded JSON
		const paymentHeader = Buffer.from(
			JSON.stringify(paymentPayload),
			'utf8'
		).toString('base64');

		console.log('[HTTP Client] Payment transaction created, simulated, and signed');

		// Retry with payment
		const newOptions = {
			...options,
			headers: {
				...(options.headers || {}),
				'X-PAYMENT': paymentHeader,
				'Access-Control-Expose-Headers': 'X-PAYMENT-RESPONSE',
			},
		};

		response = await fetch(url, newOptions);

		if (response.ok) {
			console.log('[HTTP Client] ✅ Payment successful');
		}

		return response;
	}

	// Return client with baseURL for convenience
	return {
		baseURL: apiBaseURL,
		wallet: keypair.publicKey.toBase58(),

		/**
		 * Make a GET request with automatic x402 payment handling
		 * @param {string} endpoint - Endpoint path
		 * @param {Object} [options] - Fetch options
		 * @returns {Promise<Object>} Response data
		 */
		async get(endpoint, options = {}) {
			const url = `${apiBaseURL}${endpoint}`;
			const response = await paymentFetch(url, {
				method: 'GET',
				...options,
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`HTTP ${response.status}: ${error}`);
			}

			return response.json();
		},

		/**
		 * Make a POST request with automatic x402 payment handling
		 * @param {string} endpoint - Endpoint path
		 * @param {Object} body - Request body
		 * @param {Object} [options] - Fetch options
		 * @returns {Promise<Object>} Response data
		 */
		async post(endpoint, body, options = {}) {
			const url = `${apiBaseURL}${endpoint}`;
			const response = await paymentFetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...options.headers,
				},
				body: JSON.stringify(body),
				...options,
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`HTTP ${response.status}: ${error}`);
			}

			return response.json();
		},
	};
}

/**
 * Make a paid request to an x402 endpoint
 * @param {Object} client - Payment-enabled client from createPaymentEnabledClient
 * @param {string} endpoint - Endpoint path (e.g., '/api/v1/mempool/fees')
 * @param {Object} [params] - Query parameters
 * @returns {Promise<Object>} Response data
 */
export async function makePaidRequest(client, endpoint, params = {}) {
	try {
		console.log('[HTTP Client] Making paid request to:', endpoint);
		console.log('[HTTP Client] Parameters:', params);

		// Build query string if params provided
		let url = endpoint;
		if (Object.keys(params).length > 0) {
			const query = new URLSearchParams(params).toString();
			url += `?${query}`;
		}

		const data = await client.get(url);

		console.log('[HTTP Client] ✅ Request successful');
		return data;
	} catch (error) {
		console.error('[HTTP Client] ❌ Request failed:', error.message);
		throw error;
	}
}
