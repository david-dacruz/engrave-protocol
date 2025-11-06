// @ts-check
import {config} from './src/config/env.js';
import app from './src/app.js';

/**
 * Engrave Protocol - Server Entry Point
 * MCP Server bridging AI Agents on Solana with Bitcoin's settlement layer
 */

const PORT = config.api.port;

// Start the server
app.listen(PORT, () => {
	console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🪶 Engrave Protocol - MCP Server                            ║
╟──────────────────────────────────────────────────────────────╢
║  Status: Running                                             ║
║  Port: ${PORT.toString().padEnd(54)}║
║  Network: Solana Devnet                                      ║
║  Treasury: ${config.treasury.walletAddress.substring(0, 20)}...${' '.repeat(18)}║
╚══════════════════════════════════════════════════════════════╝
	`);
	console.log(`🔗 API Endpoints:`);
	console.log(`   GET  ${config.api.baseUrl}/health`);
	console.log(`   GET  ${config.api.baseUrl}/api/inscribe (x402 protected)`);
	console.log('');
});
