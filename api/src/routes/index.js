// @ts-check
import express from 'express';
import inscribeRoutes from './inscribe.routes.js';

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
	});
});

// Mount inscription routes
router.use('/api', inscribeRoutes);

// Add more route modules here as the project grows
// router.use('/api/ordinals', ordinalsRoutes);
// router.use('/api/bitcoin', bitcoinRoutes);

export default router;
