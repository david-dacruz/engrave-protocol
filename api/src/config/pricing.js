// @ts-check

import Decimal from 'decimal.js';

/**
 * Pricing Configuration for x402 Endpoints
 * Supports multiple SPL tokens with configurable decimals
 *
 * All internal calculations use Decimal.js for arbitrary precision arithmetic
 * to prevent floating-point rounding errors in financial calculations.
 *
 * Token Examples:
 * - USDC (6 decimals): $0.01 = 10000
 * - USDT (6 decimals): $0.01 = 10000
 * - SOL (9 decimals): 0.01 SOL = 10000000
 * - BONK (5 decimals): 1 BONK = 100000
 */

/**
 * Supported SPL Tokens Configuration
 */
export const tokenConfig = {
	// USDC - Circle USD Coin
	USDC: {
		decimals: 6,
		symbol: 'USDC',
		name: 'USD Coin',
		// Devnet mint: Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
		mint: process.env.USDC_MINT || 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
	},
	// USDT - Tether USD
	USDT: {
		decimals: 6,
		symbol: 'USDT',
		name: 'Tether USD',
		mint: process.env.USDT_MINT || 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
	},
	// SOL - Native Solana
	SOL: {
		decimals: 9,
		symbol: 'SOL',
		name: 'Solana',
		mint: 'So11111111111111111111111111111111111111112', // Native SOL wrapped mint
	},
	// BONK - Community Meme Coin
	BONK: {
		decimals: 5,
		symbol: 'BONK',
		name: 'Bonk',
		mint: process.env.BONK_MINT || 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
	},
};

/**
 * Get active payment token configuration
 * @returns {Object} Token configuration
 */
export function getPaymentToken() {
	const tokenSymbol = process.env.PAYMENT_TOKEN || 'USDC';
	const token = tokenConfig[tokenSymbol];

	if (!token) {
		console.warn(`[PRICING] Unknown token: ${tokenSymbol}, defaulting to USDC`);
		return tokenConfig.USDC;
	}

	return token;
}

/**
 * Parse price from environment variable or use default
 * Uses Decimal.js for precise conversion to token's base units
 *
 * @param {string} envVar - Environment variable name
 * @param {number} defaultPrice - Default price in current token's base units
 * @returns {number} Price in base units (converted from Decimal to integer)
 *
 * @example
 * // USDC with 6 decimals:
 * parsePrice('PRICE_FOO', 100000) // $0.10 = 100000 base units
 */
function parsePrice(envVar, defaultPrice) {
	const value = process.env[envVar];
	if (!value) return defaultPrice;

	try {
		// Use Decimal for precise parsing
		const parsed = new Decimal(value);

		// Validate the parsed value
		if (parsed.isNaN() || parsed.lessThan(0)) {
			console.warn(`[PRICING] Invalid value for ${envVar}: ${value}, using default: ${defaultPrice}`);
			return defaultPrice;
		}

		// Convert to token's base units using configured decimals
		// All arithmetic is done with Decimal for precision
		const token = getPaymentToken();
		const multiplier = new Decimal(10).pow(token.decimals);
		const baseUnits = parsed.times(multiplier).floor();

		// Convert back to number for storage (safe at this point since we're using integers)
		return baseUnits.toNumber();
	} catch (error) {
		console.warn(`[PRICING] Error parsing ${envVar}: ${error.message}, using default: ${defaultPrice}`);
		return defaultPrice;
	}
}

/**
 * Pricing tiers configuration
 */
export const pricingConfig = {
	// Mempool.io Bridge Endpoints
	mempool: {
		// Address queries
		addressInfo: parsePrice('PRICE_MEMPOOL_ADDRESS', 100000), // $0.10
		addressTxs: parsePrice('PRICE_MEMPOOL_ADDRESS_TXS', 250000), // $0.25

		// Transaction queries
		transaction: parsePrice('PRICE_MEMPOOL_TX', 100000), // $0.10
		txStatus: parsePrice('PRICE_MEMPOOL_TX_STATUS', 50000), // $0.05

		// Block queries
		block: parsePrice('PRICE_MEMPOOL_BLOCK', 100000), // $0.10

		// Statistics & Fees (popular, should be cheap!)
		fees: parsePrice('PRICE_MEMPOOL_FEES', 10000), // $0.01 (micropayment!)
		stats: parsePrice('PRICE_MEMPOOL_STATS', 10000), // $0.01 (micropayment!)
	},

	// Bitcoin Ordinals (keep existing)
	ordinals: {
		inscription: parsePrice('PRICE_ORDINALS_INSCRIPTION', 1000000), // $1.00
		batchInscription: parsePrice('PRICE_ORDINALS_BATCH', 900000), // $0.90 per inscription
	},

	// Multipliers for different usage tiers (future feature)
	tiers: {
		free: 1.0,        // Free tier (if applicable)
		basic: 1.0,       // Basic tier - standard pricing
		premium: 0.75,    // Premium tier - 25% discount
		enterprise: 0.5,  // Enterprise tier - 50% discount
	},
};

/**
 * Get price for a specific endpoint
 * Uses Decimal.js for precise tier multiplier calculations
 *
 * @param {string} category - Category (e.g., 'mempool', 'ordinals')
 * @param {string} endpoint - Endpoint name (e.g., 'addressInfo', 'fees')
 * @param {string} [tier='basic'] - Pricing tier
 * @returns {number} Price in token base units (converted from Decimal to integer)
 *
 * @example
 * // Get price for mempool address query with premium tier
 * getPrice('mempool', 'addressInfo', 'premium') // Returns price after 25% discount
 */
export function getPrice(category, endpoint, tier = 'basic') {
	const basePrice = pricingConfig[category]?.[endpoint];

	if (!basePrice) {
		console.error(`[PRICING] Unknown endpoint: ${category}.${endpoint}`);
		return 0;
	}

	const tierMultiplier = pricingConfig.tiers[tier] || 1.0;

	// Use Decimal for precise tier multiplier calculations
	const basePriceDecimal = new Decimal(basePrice);
	const multiplierDecimal = new Decimal(tierMultiplier);
	const finalPrice = basePriceDecimal.times(multiplierDecimal).floor();

	// Convert back to number for return (safe since result is integer)
	return finalPrice.toNumber();
}

/**
 * Format price for display
 * Uses Decimal.js for precise conversion from base units to display amount
 *
 * @param {number} priceInTokenUnits - Price in token's base units
 * @returns {string} Formatted price (e.g., "$0.10", "0.01 SOL")
 *
 * @example
 * // USDC with 6 decimals:
 * formatPrice(100000) // Returns "$0.10"
 * // SOL with 9 decimals:
 * formatPrice(10000000) // Returns "0.01 SOL"
 */
export function formatPrice(priceInTokenUnits) {
	const token = getPaymentToken();

	// Use Decimal for precise division from base units
	const priceDecimal = new Decimal(priceInTokenUnits);
	const divisor = new Decimal(10).pow(token.decimals);
	const amount = priceDecimal.dividedBy(divisor);

	// Format to appropriate precision (4 decimals or token decimals, whichever is less)
	const maxDecimals = Math.min(4, token.decimals);
	const formatted = amount.toFixed(maxDecimals).replace(/\.?0+$/, '');

	// For USD-pegged tokens, use $ prefix
	if (token.symbol === 'USDC' || token.symbol === 'USDT') {
		return `$${formatted}`;
	}

	return `${formatted} ${token.symbol}`;
}

/**
 * Get all pricing info (for documentation/display)
 * @returns {Object}
 */
export function getAllPricing() {
	return {
		mempool: {
			'GET /api/mempool/address/:address': formatPrice(pricingConfig.mempool.addressInfo),
			'GET /api/mempool/address/:address/txs': formatPrice(pricingConfig.mempool.addressTxs),
			'GET /api/mempool/tx/:txid': formatPrice(pricingConfig.mempool.transaction),
			'GET /api/mempool/tx/:txid/status': formatPrice(pricingConfig.mempool.txStatus),
			'GET /api/mempool/block/:hash': formatPrice(pricingConfig.mempool.block),
			'GET /api/mempool/fees': formatPrice(pricingConfig.mempool.fees),
			'GET /api/mempool/stats': formatPrice(pricingConfig.mempool.stats),
		},
		ordinals: {
			'POST /api/inscribe': formatPrice(pricingConfig.ordinals.inscription),
			'POST /api/ordinals/batch': `${formatPrice(pricingConfig.ordinals.batchInscription)}/inscription`,
		},
	};
}

// Log pricing on module load
const activeToken = getPaymentToken();
console.log('[PRICING] Configuration loaded:');
console.log(`[PRICING] Payment Token: ${activeToken.name} (${activeToken.symbol})`);
console.log(`[PRICING] Token Decimals: ${activeToken.decimals}`);
console.log('[PRICING] Mempool endpoints:');
console.log(`  - Address info: ${formatPrice(pricingConfig.mempool.addressInfo)}`);
console.log(`  - Address txs: ${formatPrice(pricingConfig.mempool.addressTxs)}`);
console.log(`  - Transaction: ${formatPrice(pricingConfig.mempool.transaction)}`);
console.log(`  - TX status: ${formatPrice(pricingConfig.mempool.txStatus)}`);
console.log(`  - Block: ${formatPrice(pricingConfig.mempool.block)}`);
console.log(`  - Fees: ${formatPrice(pricingConfig.mempool.fees)}`);
console.log(`  - Stats: ${formatPrice(pricingConfig.mempool.stats)}`);
