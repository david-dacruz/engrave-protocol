// @ts-check
import express from 'express';
import { bitcoinService } from '../services/bitcoin.service.js';

const router = express.Router();

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

/**
 * GET /api/bitcoin/address
 * Generate new Bitcoin address
 */
/** @type {import('express').RequestHandler} */
const generateAddressHandler = async (req, res) => {
    try {
        const { index } = req.query;
        
        // Initialize master key if not already done
        if (!bitcoinService.masterKey) {
            await bitcoinService.initializeMasterKey();
        }

        const addressIndex = index ? parseInt(index, 10) : 0;
        
        if (isNaN(addressIndex) || addressIndex < 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Index must be a non-negative integer',
            });
        }

        const addressInfo = await bitcoinService.generateAddress(addressIndex);
        
        return res.json({
            success: true,
            address: addressInfo.address,
            publicKey: addressInfo.publicKey,
            index: addressIndex,
            network: bitcoinService.getNetworkInfo().network,
            note: 'Private key is not returned for security reasons',
        });
    } catch (error) {
        console.error('Error generating address:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};

/**
 * GET /api/bitcoin/balance/:address
 * Check Bitcoin balance for address (mock implementation)
 */
/** @type {import('express').RequestHandler} */
const getBalanceHandler = async (req, res) => {
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

        // Mock balance data - in production, this would query a Bitcoin node or API
        const mockBalance = {
            address,
            balance: {
                confirmed: 0,
                unconfirmed: 0,
                total: 0,
            },
            utxos: [],
            network: bitcoinService.getNetworkInfo().network,
            note: 'This is mock data. In production, this would query a Bitcoin node or blockchain API.',
        };
        
        return res.json({
            success: true,
            ...mockBalance,
        });
    } catch (error) {
        console.error('Error getting balance:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};

/**
 * GET /api/bitcoin/tx/:txid
 * Get transaction details by transaction ID (mock implementation)
 */
/** @type {import('express').RequestHandler} */
const getTransactionHandler = async (req, res) => {
    try {
        const { txid } = req.params;
        
        if (!txid) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Transaction ID is required',
            });
        }

        // Validate transaction ID format (64 hex characters)
        if (!/^[a-fA-F0-9]{64}$/.test(txid)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid transaction ID format',
            });
        }

        // Mock transaction data - in production, this would query a Bitcoin node or API
        const mockTransaction = {
            txid,
            status: 'confirmed',
            confirmations: 6,
            blockHeight: 2500000,
            blockHash: '0000000000000000000' + txid.substring(0, 45),
            fee: 1000, // satoshis
            size: 250, // bytes
            vsize: 141, // virtual bytes
            inputs: [
                {
                    txid: 'a'.repeat(64),
                    vout: 0,
                    value: 100000, // satoshis
                    address: 'tb1qexampleaddress1',
                }
            ],
            outputs: [
                {
                    value: 99000, // satoshis
                    address: 'tb1qexampleaddress2',
                    scriptPubKey: '0014' + 'a'.repeat(40),
                }
            ],
            network: bitcoinService.getNetworkInfo().network,
            note: 'This is mock data. In production, this would query a Bitcoin node or blockchain API.',
        };
        
        return res.json({
            success: true,
            transaction: mockTransaction,
        });
    } catch (error) {
        console.error('Error getting transaction:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};

/**
 * POST /api/bitcoin/validate
 * Validate Bitcoin address
 */
/** @type {import('express').RequestHandler} */
const validateAddressHandler = async (req, res) => {
    try {
        const { address } = req.body;
        
        if (!address) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Bitcoin address is required',
            });
        }

        const isValid = bitcoinService.validateAddress(address);
        const networkInfo = bitcoinService.getNetworkInfo();
        
        return res.json({
            success: true,
            address,
            valid: isValid,
            network: networkInfo.network,
            message: isValid 
                ? `Valid Bitcoin address for ${networkInfo.network}` 
                : `Invalid Bitcoin address for ${networkInfo.network}`,
        });
    } catch (error) {
        console.error('Error validating address:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};

/**
 * GET /api/bitcoin/network
 * Get Bitcoin network information
 */
/** @type {import('express').RequestHandler} */
const getNetworkInfoHandler = async (req, res) => {
    try {
        const networkInfo = bitcoinService.getNetworkInfo();
        
        return res.json({
            success: true,
            network: networkInfo.network,
            isTestnet: networkInfo.isTestnet,
            bech32Prefix: networkInfo.bech32Prefix,
            features: {
                addressGeneration: true,
                addressValidation: true,
                transactionSigning: true,
                ordinalsInscription: true,
            },
            endpoints: {
                generateAddress: 'GET /api/bitcoin/address?index=0',
                validateAddress: 'POST /api/bitcoin/validate',
                getBalance: 'GET /api/bitcoin/balance/:address',
                getTransaction: 'GET /api/bitcoin/tx/:txid',
                networkInfo: 'GET /api/bitcoin/network',
            },
        });
    } catch (error) {
        console.error('Error getting network info:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};

/**
 * POST /api/bitcoin/fee-estimate
 * Estimate transaction fee
 */
/** @type {import('express').RequestHandler} */
const estimateFeeHandler = async (req, res) => {
    try {
        const { inputCount, outputCount, feeRate } = req.body;
        
        if (!inputCount || !outputCount) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'inputCount and outputCount are required',
            });
        }

        const inputs = parseInt(inputCount, 10);
        const outputs = parseInt(outputCount, 10);
        const rate = feeRate ? parseInt(feeRate, 10) : 10;
        
        if (isNaN(inputs) || isNaN(outputs) || isNaN(rate) || inputs < 1 || outputs < 1 || rate < 1) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'inputCount, outputCount, and feeRate must be positive integers',
            });
        }

        const estimatedFee = bitcoinService.estimateTransactionFee(inputs, outputs, rate);
        const estimatedSize = (inputs * 68) + (outputs * 31) + 11; // Rough estimation
        
        return res.json({
            success: true,
            estimate: {
                inputCount: inputs,
                outputCount: outputs,
                feeRate: rate,
                estimatedSize: estimatedSize,
                estimatedFee: estimatedFee,
                estimatedFeeInBTC: bitcoinService.satoshisToBTC(estimatedFee),
            },
            note: 'This is an estimate for P2WPKH transactions. Actual fees may vary.',
        });
    } catch (error) {
        console.error('Error estimating fee:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};

// Mount routes
router.get('/network', getNetworkInfoHandler);
router.get('/address', generateAddressHandler);
router.get('/balance/:address', getBalanceHandler);
router.get('/tx/:txid', getTransactionHandler);
router.post('/validate', validateAddressHandler);
router.post('/fee-estimate', estimateFeeHandler);

export default router;