// @ts-check
import { z } from 'zod';

/**
 * Zod Validation Middleware for Express
 * Validates request parameters, query, and body against Zod schemas
 */

/**
 * Create validation middleware for request parameters
 * @param {z.ZodSchema} schema Zod schema to validate against
 * @param {string} source Source of data ('params', 'query', 'body')
 * @returns {Function} Express middleware
 */
export function validateRequest(schema, source = 'params') {
	return (req, res, next) => {
		try {
			const data = req[source];
			const validated = schema.parse(data);

			// Store validated data in req.validated
			// Note: In Express 5, req.query and req.params are getters and cannot be directly set
			if (!req.validated) {
				req.validated = {};
			}
			req.validated[source] = validated;

			next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				return res.status(400).json({
					success: false,
					error: 'Validation error',
					details: error.issues.map(issue => ({
						path: issue.path.join('.'),
						message: issue.message,
						code: issue.code,
					})),
				});
			}
			// Pass other errors to error handler
			next(error);
		}
	};
}

/**
 * Validate request params
 * @param {z.ZodSchema} schema Zod schema
 * @returns {Function} Express middleware
 */
export const validateParams = (schema) => validateRequest(schema, 'params');

/**
 * Validate query parameters
 * @param {z.ZodSchema} schema Zod schema
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => validateRequest(schema, 'query');

/**
 * Validate request body
 * @param {z.ZodSchema} schema Zod schema
 * @returns {Function} Express middleware
 */
export const validateBody = (schema) => validateRequest(schema, 'body');

/**
 * Validate response data against schema (for testing/development)
 * @param {z.ZodSchema} schema Zod schema
 * @returns {Function} Express middleware
 */
export function validateResponse(schema) {
	return (req, res, next) => {
		const originalJson = res.json.bind(res);

		res.json = function(data) {
			try {
				// Validate response in development
				if (process.env.NODE_ENV !== 'production') {
					schema.parse(data);
				}
				return originalJson(data);
			} catch (error) {
				if (error instanceof z.ZodError) {
					console.error('[VALIDATION] Response validation failed:', {
						path: req.path,
						issues: error.issues,
					});
					// In development, return validation error
					if (process.env.NODE_ENV !== 'production') {
						return originalJson({
							success: false,
							error: 'Response validation error',
							details: error.issues,
						});
					}
				}
				return originalJson(data);
			}
		};

		next();
	};
}
