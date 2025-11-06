// @ts-check

/**
 * Global Error Handler Middleware
 * Catches and formats errors consistently across the application
 */

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

/**
 * @typedef {Error & {statusCode?: number, name?: string}} AppError
 */

/**
 * @param {AppError} err
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export const errorHandler = (err, req, res, next) => {
	// Log error for debugging
	console.error('Error:', {
		message: err.message,
		stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
		path: req.path,
		method: req.method,
	});

	// Handle specific error types
	if (err.name === 'ValidationError') {
		return res.status(400).json({
			error: 'Validation Error',
			message: err.message,
		});
	}

	if (err.name === 'UnauthorizedError') {
		return res.status(401).json({
			error: 'Unauthorized',
			message: 'Invalid or missing authentication',
		});
	}

	// Default to 500 server error
	res.status(err.statusCode || 500).json({
		error: 'Internal Server Error',
		message:
			process.env.NODE_ENV === 'development'
				? err.message
				: 'Something went wrong',
	});
};

/**
 * 404 Not Found Handler
 *
 * @param {Request} req
 * @param {Response} res
 */
export const notFoundHandler = (req, res) => {
	res.status(404).json({
		error: 'Not Found',
		message: `Route ${req.method} ${req.path} not found`,
	});
};
