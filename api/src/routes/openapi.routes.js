// @ts-check
import express from 'express';
import { generateOpenAPISpec } from '../config/openapi.js';

const router = express.Router();

/**
 * Serve auto-generated OpenAPI specification
 * This replaces the manual swagger-jsdoc approach
 */
router.get('/openapi.json', (req, res) => {
	try {
		const spec = generateOpenAPISpec();
		res.json(spec);
	} catch (error) {
		console.error('[OpenAPI] Error generating spec:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to generate OpenAPI specification',
			details: error.message,
		});
	}
});

/**
 * Serve Swagger UI (redirect to existing /api-docs for now)
 */
router.get('/docs', (req, res) => {
	res.redirect('/api-docs');
});

export default router;
