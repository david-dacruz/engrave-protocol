// @ts-check
import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

/**
 * Wallet Utilities for MCP Server
 * Handles Solana wallet loading, creation, and validation
 */

/**
 * Load wallet from environment variable or file
 * @param {string} [filePath] - Optional file path to load wallet from
 * @returns {Keypair} Solana keypair
 */
export function loadWallet(filePath) {
	// Priority 1: Environment variable
	const envSecret = process.env.MCP_WALLET_SECRET_KEY;
	if (envSecret) {
		try {
			const secretKey = Uint8Array.from(JSON.parse(envSecret));
			const keypair = Keypair.fromSecretKey(secretKey);
			console.log('[MCP Wallet] Loaded from environment variable');
			console.log('[MCP Wallet] Address:', keypair.publicKey.toBase58());
			return keypair;
		} catch (error) {
			throw new Error(`Failed to load wallet from env: ${error.message}`);
		}
	}

	// Priority 2: File path
	const walletPath = filePath || process.env.MCP_WALLET_FILE || 'mcp_wallet.json';

	if (fs.existsSync(walletPath)) {
		try {
			const raw = fs.readFileSync(walletPath, 'utf8').trim();
			const secretKey = Uint8Array.from(JSON.parse(raw));
			const keypair = Keypair.fromSecretKey(secretKey);
			console.log('[MCP Wallet] Loaded from file:', walletPath);
			console.log('[MCP Wallet] Address:', keypair.publicKey.toBase58());
			return keypair;
		} catch (error) {
			throw new Error(`Failed to load wallet from file: ${error.message}`);
		}
	}

	// Priority 3: Create new wallet
	console.log('[MCP Wallet] No wallet found, creating new one...');
	return createWallet(walletPath);
}

/**
 * Create a new Solana wallet and save it
 * @param {string} [filePath] - File path to save wallet
 * @returns {Keypair} Newly created Solana keypair
 */
export function createWallet(filePath = 'mcp_wallet.json') {
	const keypair = Keypair.generate();

	try {
		const secretKeyArray = Array.from(keypair.secretKey);
		fs.writeFileSync(filePath, JSON.stringify(secretKeyArray));

		console.log('[MCP Wallet] ✅ Created new wallet');
		console.log('[MCP Wallet] Address:', keypair.publicKey.toBase58());
		console.log('[MCP Wallet] Saved to:', filePath);
		console.log('[MCP Wallet] ⚠️  IMPORTANT: Fund this wallet with USDC on Devnet');
		console.log('[MCP Wallet] 💰 Faucet: https://faucet.circle.com');

		return keypair;
	} catch (error) {
		throw new Error(`Failed to create wallet: ${error.message}`);
	}
}

/**
 * Validate that a keypair is valid
 * @param {Keypair} keypair - Keypair to validate
 * @returns {boolean} True if valid
 */
export function validateWallet(keypair) {
	try {
		// Check if keypair has required methods
		if (!keypair.publicKey || !keypair.secretKey) {
			return false;
		}

		// Check if public key is valid
		const address = keypair.publicKey.toBase58();
		if (address.length < 32) {
			return false;
		}

		return true;
	} catch {
		return false;
	}
}

/**
 * Get wallet address from keypair
 * @param {Keypair} keypair - Solana keypair
 * @returns {string} Base58 encoded address
 */
export function getWalletAddress(keypair) {
	return keypair.publicKey.toBase58();
}
