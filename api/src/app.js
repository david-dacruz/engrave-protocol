// @ts-check
import express from 'express';
import redoc from 'redoc-express';
import {corsMiddleware} from './middleware/cors.js';
import {errorHandler, notFoundHandler} from './middleware/errorHandler.js';
import {swaggerSpec} from './config/swagger.js';
import routes from './routes/index.js';

/**
 * Express Application Setup
 */

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// CORS middleware
app.use(corsMiddleware);

// Mount Redoc API documentation at /api-docs
app.use(
	'/api-docs',
	redoc({
		title: 'Engrave Protocol API',
		specUrl: '/api-docs.json',
		redocOptions: {
			theme: {
				dark: {
					primaryColor: '#1a1a1a',
				},
			},
			darkMode: true,
			hideDownloadButton: true,
			expandResponses: '200,201,400,401,403,404,500',
			sortPropsAlphabetically: true,
			hideHostname: false,
		},
	}),
);

// Mount OpenAPI JSON spec at /api-docs.json
app.get('/api-docs.json', (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.send(swaggerSpec);
});

// Mount all routes
app.use(routes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
