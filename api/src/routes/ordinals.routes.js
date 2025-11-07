// @ts-check
import express from 'express';
import { agentService } from '../services/agent.service.js';
import { bitcoinService } from '../services/bitcoin.service.js';
import { x402Service } from '../services/x402.service.js';

const router = express.Router();

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

/**
 * GET /api/ordinals/:id
 * Get inscription details by ID
 */
/** @type {import('express').RequestHandler} */
const getInscriptionHandler = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Inscription ID is required',
            });
        }

        const inscription = await agentService.getInscriptionStatus(id);
        
        return res.json({
            success: true,
            inscription,
        });
    } catch (error) {
        console.error('Error getting inscription:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};

/**
 * GET /api/ordinals/address/:address
 * List inscriptions by Bitcoin address
 */
/** @type {import('express').RequestHandler} */
const listInscriptionsByAddressHandler = async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!address) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Bitcoin address is required',
            });
        }

        // Validate Bitcoin address
        if (!bitcoinService.validateAddress(address)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid Bitcoin address',
            });
        }

        const inscriptions = await agentService.listInscriptionsByAddress(address);
        
        return res.json({
            success: true,
            address,
            inscriptions,
            count: inscriptions.length,
        });
    } catch (error) {
        console.error('Error listing inscriptions:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};

/**
 * POST /api/ordinals/batch
 * x402 payment-protected endpoint for batch Bitcoin Ordinals inscriptions
 */
/** @type {import('express').RequestHandler} */
const batchInscribeHandler = async (req, res) => {
    try {
        const { inscriptions } = req.body;
        
        if (!inscriptions || !Array.isArray(inscriptions) || inscriptions.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Inscriptions array is required and must not be empty',
            });
        }

        if (inscriptions.length > 10) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Maximum 10 inscriptions per batch',
            });
        }

        // Extract payment header from request
        const paymentHeader = x402Service.extractPayment(req.headers);

        console.log('[BATCH_INSCRIBE] paymentHeader present?', !!paymentHeader);

        // Create payment requirements: $1.00 USDC per inscription
        const totalPrice = inscriptions.length * 1000000; // $1.00 per inscription in USDC (6 decimals)
        const paymentRequirements = await x402Service.createPaymentRequirements(
            totalPrice,
            '/api/ordinals/batch',
            `Batch Bitcoin Ordinals Inscription (${inscriptions.length} inscriptions)`
        );

        // If no payment header, return 402 Payment Required
        if (!paymentHeader) {
            const response = x402Service.create402Response(paymentRequirements);
            return res.status(response.status).json(response.body);
        }

        console.log('paymentRequirements', paymentRequirements);

        // Verify the payment
        const verified = await x402Service.verifyPayment(
            paymentHeader,
            paymentRequirements
        );

        console.log('verified', verified);

        if (!verified) {
            return res.status(402).json({
                error: 'Invalid payment',
                message: 'Payment verification failed',
            });
        }

        // Process batch inscriptions
        const results = [];
        const errors = [];

        for (let i = 0; i < inscriptions.length; i++) {
            try {
                const inscription = inscriptions[i];
                const result = await agentService.processInscriptionRequest(inscription);
                results.push({
                    index: i,
                    success: result.success,
                    message: result.message,
                    inscription: result.inscription,
                });
            } catch (error) {
                errors.push({
                    index: i,
                    error: error.message,
                });
            }
        }

        // Settle the payment
        await x402Service.settlePayment(paymentHeader, paymentRequirements);

        // Return batch results
        return res.json({
            success: true,
            message: `Batch inscription completed: ${results.filter(r => r.success).length}/${inscriptions.length} successful`,
            results,
            errors,
            totalProcessed: inscriptions.length,
            successCount: results.filter(r => r.success).length,
            errorCount: errors.length,
        });
    } catch (error) {
        console.error('Error handling batch inscribe endpoint:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
};

/**
 * GET /api/ordinals/stats
 * Get general statistics about inscriptions (free endpoint)
 */
/** @type {import('express').RequestHandler} */
const getStatsHandler = async (req, res) => {
    try {
        // Mock statistics for now
        const stats = {
            totalInscriptions: 0,
            totalSize: 0,
            averageSize: 0,
            supportedContentTypes: [
                'text/plain',
                'text/html',
                'text/css',
                'text/javascript',
                'application/json',
                'image/png',
                'image/jpeg',
                'image/gif',
                'image/svg+xml',
                'image/webp'
            ],
            maxInscriptionSize: 400 * 1024, // 400KB
            network: bitcoinService.getNetworkInfo().network,
            pricing: {
                singleInscription: '$1.00 USDC',
                batchInscription: '$1.00 USDC per inscription',
                currency: 'USDC',
                network: 'Solana Devnet',
            },
        };
        
        return res.json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};

// Mount routes
router.get('/stats', getStatsHandler);
router.get('/:id', getInscriptionHandler);
router.get('/address/:address', listInscriptionsByAddressHandler);
router.post('/batch', batchInscribeHandler);

export default router;