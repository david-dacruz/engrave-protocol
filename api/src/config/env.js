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
 */

/**
 * @typedef {Record<string, string | undefined>} EnvVarMap
 */

/** @type {EnvVarMap} */
const requiredEnvVars = {
	TREASURY_WALLET_ADDRESS: process.env.TREASURY_WALLET_ADDRESS,
	BASE_API_URL: process.env.BASE_API_URL,
	PORT: process.env.PORT,
};

// Optional environment variables with defaults
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://facilitator.payai.network';
const X402_NETWORK = process.env.X402_NETWORK || 'solana-devnet';

// Validate all required environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
	if (!value) {
		console.error(`❌ Missing required environment variable: ${key}`);
		process.exit(1);
	}
}

const treasuryWalletAddress = requiredEnvVars.TREASURY_WALLET_ADDRESS.trim();
const baseApiUrl = requiredEnvVars.BASE_API_URL.trim();
const parsedPort = Number.parseInt(requiredEnvVars.PORT, 10);

if (treasuryWalletAddress.length === 0) {
	console.error('❌ Invalid TREASURY_WALLET_ADDRESS environment variable: must not be empty');
	process.exit(1);
}

if (!Number.isSafeInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
	console.error('❌ Invalid PORT environment variable: must be an integer between 1 and 65535');
	process.exit(1);
}

try {
	// Validate URL formatting early to surface configuration mistakes
	new URL(baseApiUrl);
} catch {
	console.error('❌ Invalid BASE_API_URL environment variable: must be a valid absolute URL');
	process.exit(1);
}

// Export validated configuration
/** @type {Config} */
export const config = {
	treasury: {
		walletAddress: treasuryWalletAddress,
	},
	api: {
		baseUrl: baseApiUrl,
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
};
