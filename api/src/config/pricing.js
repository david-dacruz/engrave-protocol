// @ts-check

import Decimal from 'decimal.js';
import pricingData from '../../pricing.config.js';

/**
 * Pricing Configuration for x402 Endpoints
 * Loads prices from pricing.config.js
 *
 * All internal calculations use Decimal.js for arbitrary precision arithmetic
 * to prevent floating-point rounding errors in financial calculations.
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
 * Convert human-readable price to base units
 * @param {number} price - Price in USD (e.g., 0.10 for $0.10)
 * @param {number} decimals - Token decimals
 * @returns {number} Price in base units
 */
function priceToBaseUnits(price, decimals) {
	const priceDecimal = new Decimal(price);
	const multiplier = new Decimal(10).pow(decimals);
	return priceDecimal.times(multiplier).floor().toNumber();
}

/**
 * Parse price with ENV override support
 * @param {string} envVar - Environment variable name
 * @param {number} configPrice - Price from config file
 * @returns {number} Price in base units
 */
function parsePrice(envVar, configPrice) {
	const token = getPaymentToken();

	// Check for ENV override first
	const envValue = process.env[envVar];
	if (envValue) {
		try {
			const parsed = new Decimal(envValue);
			if (parsed.isNaN() || parsed.lessThan(0)) {
				console.warn(`[PRICING] Invalid value for ${envVar}: ${envValue}, using config: ${configPrice}`);
				return priceToBaseUnits(configPrice, token.decimals);
			}
			return priceToBaseUnits(parsed.toNumber(), token.decimals);
		} catch (error) {
			console.warn(`[PRICING] Error parsing ${envVar}: ${error.message}, using config: ${configPrice}`);
			return priceToBaseUnits(configPrice, token.decimals);
		}
	}

	// Use config price
	return priceToBaseUnits(configPrice, token.decimals);
}

/**
 * Build pricing configuration from config file
 */
function buildPricingConfig() {
	const config = {
		mempool: {},
		tiers: pricingData.tiers,
	};

	// Load mempool prices
	for (const [key, value] of Object.entries(pricingData.mempool)) {
		const envVar = `PRICE_MEMPOOL_${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`;
		config.mempool[key] = parsePrice(envVar, value.price);
	}

	return config;
}

/**
 * Pricing configuration (loaded from pricing.config.js)
 */
export const pricingConfig = buildPricingConfig();

/**
 * Get price for a specific endpoint
 * @param {string} category - Category (e.g., 'mempool', 'ordinals')
 * @param {string} endpoint - Endpoint name (e.g., 'addressInfo', 'fees')
 * @param {string} [tier='basic'] - Pricing tier
 * @returns {number} Price in token base units
 */
export function getPrice(category, endpoint, tier = 'basic') {
	const basePrice = pricingConfig[category]?.[endpoint];

	if (basePrice === undefined) {
		console.error(`[PRICING] Unknown endpoint: ${category}.${endpoint}`);
		return 0;
	}

	const tierMultiplier = pricingConfig.tiers[tier] || 1.0;

	// Use Decimal for precise tier multiplier calculations
	const basePriceDecimal = new Decimal(basePrice);
	const multiplierDecimal = new Decimal(tierMultiplier);
	const finalPrice = basePriceDecimal.times(multiplierDecimal).floor();

	return finalPrice.toNumber();
}

/**
 * Get endpoint metadata from config
 * @param {string} category - Category
 * @param {string} endpoint - Endpoint name
 * @returns {Object|null} Endpoint metadata
 */
export function getEndpointMetadata(category, endpoint) {
	return pricingData[category]?.[endpoint] || null;
}

/**
 * Get all pricing data (for manifest generation)
 * @returns {Object} Complete pricing data
 */
export function getAllPricingData() {
	return pricingData;
}

/**
 * Log pricing configuration on startup
 */
export function logPricingConfig() {
	const token = getPaymentToken();

	console.log('[PRICING] Configuration loaded:');
	console.log(`[PRICING] Payment Token: ${token.name} (${token.symbol})`);
	console.log(`[PRICING] Token Decimals: ${token.decimals}`);
	console.log('[PRICING] Mempool endpoints:');

	for (const [key, value] of Object.entries(pricingData.mempool)) {
		const priceUSD = value.price.toFixed(2);
		console.log(`  - ${value.description}: $${priceUSD}`);
	}
}
