// @ts-check
import express from 'express';
import mempoolRoutes from './mempool.routes.js';
import { generateManifest } from '../services/manifest.service.js';

const router = express.Router();

/**
 * Root API routes with versioning
 *
 * API Structure:
 * - /api/v1/mempool/* - Production-ready mempool endpoints with x402 payments
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: API health check
 *     description: Check the health and status of the Engrave Protocol API
 *     responses:
 *       '200':
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get('/health', (req, res) => {
	res.json({
		status: 'healthy',
		service: 'Engrave Protocol - Mempool Bridge',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
		features: {
			mempoolBridge: true,
			mcpServer: true,
			x402Payments: true,
		},
		endpoints: {
			v1: {
				mempool: '/api/v1/mempool/*',
			},
			utility: {
				health: '/health',
				apiDocs: '/api-docs',
				apiDocsJson: '/api-docs.json',
			},
			discovery: {
				x402Manifest: '/.well-known/x402.json',
			},
		},
	});
});

/**
 * @swagger
 * /.well-known/x402.json:
 *   get:
 *     tags:
 *       - Discovery
 *     summary: x402 service discovery manifest
 *     description: Machine-readable manifest for x402 Bazaar service discovery. Makes this API discoverable by AI agents.
 *     responses:
 *       '200':
 *         description: Service manifest
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 version:
 *                   type: string
 *                 description:
 *                   type: string
 *                 protocol:
 *                   type: string
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/.well-known/x402.json', (req, res) => {
	const manifest = generateManifest();
	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
	res.json(manifest);
});

// Mount v1 production routes
router.use('/api/v1/mempool', mempoolRoutes);

export default router;
