// @ts-check
import express from 'express';
import {corsMiddleware} from './middleware/cors.js';
import {errorHandler, notFoundHandler} from './middleware/errorHandler.js';
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

// Mount all routes
app.use(routes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
