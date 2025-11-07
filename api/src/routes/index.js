// @ts-check
import express from 'express';
import inscribeRoutes from './inscribe.routes.js';
import ordinalsRoutes from './ordinals.routes.js';
import bitcoinRoutes from './bitcoin.routes.js';

const router = express.Router();

/**
 * Root API routes
 */

// Health check endpoint
router.get('/health', (req, res) => {
	res.json({
		status: 'healthy',
		service: 'Engrave Protocol MCP Server',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
		features: {
			bitcoinWallet: true,
			ordinalsInscription: true,
			mcpServer: true,
			x402Payments: true,
		},
		endpoints: {
			inscription: '/api/inscribe',
			ordinals: '/api/ordinals/*',
			bitcoin: '/api/bitcoin/*',
			health: '/health',
		},
	});
});

// Mount inscription routes
router.use('/api', inscribeRoutes);

// Mount ordinals routes
router.use('/api/ordinals', ordinalsRoutes);

// Mount bitcoin routes
router.use('/api/bitcoin', bitcoinRoutes);

export default router;
