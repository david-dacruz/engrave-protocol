// @ts-check
import 'dotenv/config'; // Load .env FIRST before any other imports
import app from './src/app.js';
import {config} from './src/config/env.js';

/**
 * Engrave Protocol - Server Entry Point
 * MCP Server bridging AI Agents on Solana with Bitcoin's settlement layer
 */

const PORT = config.api.port;
const TA = config.treasury.walletAddress;

// Start the server
app.listen(PORT, () => {
	console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Engrave Protocol - MCP Server                               ║
╟──────────────────────────────────────────────────────────────╢
║  Status: Running                                             ║
║  Port: ${PORT.toString().padEnd(54)}║
║. Treasury: ${TA}.     ║
║  Network: Solana Devnet                                      ║
╚══════════════════════════════════════════════════════════════╝
	`);
});
