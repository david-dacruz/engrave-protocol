// @ts-check

/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing for x402 payments
 */

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export const corsMiddleware = (req, res, next) => {
	// Allow all origins (adjust in production as needed)
	res.header('Access-Control-Allow-Origin', '*');

	// Allow x402 payment headers
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, x402-Signature, x402-PublicKey'
	);

	// Allow GET and POST methods
	res.header('Access-Control-Allow-Methods', 'GET, POST');

	// Handle preflight requests
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}

	next();
};
