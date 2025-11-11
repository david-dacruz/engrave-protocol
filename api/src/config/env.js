// @ts-check
import 'dotenv/config';

/**
 * Validates and exports environment variables
 * Fails fast if required variables are missing
 */

/**
 * @typedef {Object} Config
 * @property {{walletAddress: string}} treasury
 * @property {{baseUrl: string, port: number}} api
 * @property {{
 *   network: string,
 *   facilitatorUrl: string,
 *   usdc: {
 *     address: string,
 *     decimals: number,
 *   },
 * }} x402
 * @property {{
 *   network: string,
 *   rpcUrl?: string,
 *   walletSeed?: string,
 *   ordinalsApiUrl?: string,
 * }} bitcoin
 * @property {{
 *   rateLimitRequests: number,
 *   rateLimitWindowMs: number,
 * }} mempool
 */

/**
 * @typedef {Record<string, string | undefined>} EnvVarMap
 */

/** @type {EnvVarMap} */
const requiredEnvVars = {
	TREASURY_WALLET_ADDRESS: process.env.TREASURY_WALLET_ADDRESS,
	PORT: process.env.PORT,
};

// Optional environment variables with defaults
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://facilitator.payai.network';
const X402_NETWORK = process.env.X402_NETWORK || 'solana-devnet';

// Parse PORT first so we can use it to derive BASE_API_URL
const parsedPort = Number.parseInt(process.env.PORT || '3000', 10);
if (!Number.isSafeInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
	console.error('❌ Invalid PORT environment variable: must be an integer between 1 and 65535');
	process.exit(1);
}

// BASE_API_URL is optional - defaults to http://localhost:PORT
const BASE_API_URL = process.env.BASE_API_URL || `http://localhost:${parsedPort}`;

// Bitcoin configuration
const BITCOIN_NETWORK = process.env.BITCOIN_NETWORK || 'testnet';
const BITCOIN_RPC_URL = process.env.BITCOIN_RPC_URL;
const BITCOIN_WALLET_SEED = process.env.BITCOIN_WALLET_SEED;
const ORDINALS_API_URL = process.env.ORDINALS_API_URL;

// Mempool.space rate limiting configuration
// mempool.space free tier: ~10 requests per second
const MEMPOOL_RATE_LIMIT_REQUESTS = Number.parseInt(process.env.MEMPOOL_RATE_LIMIT_REQUESTS || '10', 10);
const MEMPOOL_RATE_LIMIT_WINDOW_MS = Number.parseInt(process.env.MEMPOOL_RATE_LIMIT_WINDOW_MS || '1000', 10);

// Validate rate limiting configuration
if (!Number.isSafeInteger(MEMPOOL_RATE_LIMIT_REQUESTS) || MEMPOOL_RATE_LIMIT_REQUESTS <= 0) {
	console.error('❌ Invalid MEMPOOL_RATE_LIMIT_REQUESTS: must be a positive integer');
	process.exit(1);
}

if (!Number.isSafeInteger(MEMPOOL_RATE_LIMIT_WINDOW_MS) || MEMPOOL_RATE_LIMIT_WINDOW_MS <= 0) {
	console.error('❌ Invalid MEMPOOL_RATE_LIMIT_WINDOW_MS: must be a positive integer');
	process.exit(1);
}

// Validate all required environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
	if (!value) {
		console.error(`❌ Missing required environment variable: ${key}`);
		process.exit(1);
	}
}

const treasuryWalletAddress = requiredEnvVars.TREASURY_WALLET_ADDRESS.trim();

if (treasuryWalletAddress.length === 0) {
	console.error('❌ Invalid TREASURY_WALLET_ADDRESS environment variable: must not be empty');
	process.exit(1);
}

// Validate BASE_API_URL format
try {
	new URL(BASE_API_URL);
} catch {
	console.error('❌ Invalid BASE_API_URL: must be a valid absolute URL');
	process.exit(1);
}

// Validate Bitcoin network
if (!['testnet', 'mainnet'].includes(BITCOIN_NETWORK)) {
	console.error('❌ Invalid BITCOIN_NETWORK: must be "testnet" or "mainnet"');
	process.exit(1);
}

// Export validated configuration
/** @type {Config} */
export const config = {
	treasury: {
		walletAddress: treasuryWalletAddress,
	},
	api: {
		baseUrl: BASE_API_URL,
		port: parsedPort,
	},
	x402: {
		network: X402_NETWORK,
		facilitatorUrl: FACILITATOR_URL,
		usdc: {
			// USDC token address on Solana devnet
			address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
			decimals: 6,
		},
	},
	bitcoin: {
		network: BITCOIN_NETWORK,
		rpcUrl: BITCOIN_RPC_URL,
		walletSeed: BITCOIN_WALLET_SEED,
		ordinalsApiUrl: ORDINALS_API_URL,
	},
	mempool: {
		rateLimitRequests: MEMPOOL_RATE_LIMIT_REQUESTS,
		rateLimitWindowMs: MEMPOOL_RATE_LIMIT_WINDOW_MS,
	},
};

/**
 * Get simplified config for manifest generation
 * @returns {Object}
 */
export function getConfig() {
	return {
		publicUrl: config.api.baseUrl,
		port: config.api.port,
		network: config.x402.network,
		treasuryPublicKey: config.treasury.walletAddress,
		bitcoinNetwork: config.bitcoin.network,
	};
}
