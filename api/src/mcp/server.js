// @ts-check
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
// DEPRECATED: Ordinals and Bitcoin address generation services removed
// import { agentService } from '../services/agent.service.js';
// import { bitcoinService } from '../services/bitcoin.service.js';
import { loadWallet, getWalletAddress } from './wallet-utils.js';
import { createPaymentEnabledClient, makePaidRequest } from './http-client.js';
import { parseHttpError } from './errors.js';
import { config } from '../config/env.js';

/**
 * Engrave Protocol MCP Server - Mempool x402 Edition
 * Provides production-ready mempool.space queries with x402 Solana payments
 * Focus: Bitcoin blockchain data access via micropayments on Solana
 */

/**
 * @typedef {Object} QueryMempoolAddressArgs
 * @property {string} address - Bitcoin address to query
 */

/**
 * @typedef {Object} QueryMempoolAddressTxsArgs
 * @property {string} address - Bitcoin address to get transactions for
 */

/**
 * @typedef {Object} QueryMempoolTransactionArgs
 * @property {string} txid - Transaction ID to query
 */

/**
 * @typedef {Object} QueryMempoolTxStatusArgs
 * @property {string} txid - Transaction ID to get status for
 */

/**
 * @typedef {Object} QueryMempoolBlockArgs
 * @property {string} block_hash - Block hash or block height to query
 */

/**
 * @typedef {Object} QueryMempoolFeesArgs
 * @property {string} [time_interval] - Time interval (1h, 24h, default: current)
 */

/**
 * @typedef {Object} QueryMempoolStatsArgs
 * (No parameters - returns current mempool statistics)
 */

/**
 * @typedef {Object} QueryMempoolHeightArgs
 * (No parameters - returns current block height, FREE endpoint)
 */

class EngraveProtocolMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'engrave-protocol',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        // Initialize wallet and HTTP client for x402 payments
        this.keypair = null;
        this.httpClient = null;
        this.initializePaymentClient();

        this.setupToolHandlers();
        this.setupErrorHandling();
    }

    /**
     * Initialize payment-enabled HTTP client for x402
     * @private
     */
    initializePaymentClient() {
        try {
            // Load Solana wallet for MCP server x402 payments
            this.keypair = loadWallet();
            console.log('[MCP Server] Wallet initialized:', getWalletAddress(this.keypair));

            // Create payment-enabled HTTP client for mempool queries
            this.httpClient = createPaymentEnabledClient(this.keypair);
            console.log('[MCP Server] HTTP client ready for x402 payments (mempool.space queries)');

            // Validate API connectivity on startup
            this.validateApiConnectivity();
        } catch (error) {
            console.error('[MCP Server] Failed to initialize payment client:', error.message);
            console.error('[MCP Server] MCP server will start but paid endpoints will fail');
            console.error('[MCP Server] Tip: Set MCP_WALLET_SECRET_KEY or MCP_WALLET_FILE environment variable');
        }
    }

    /**
     * Validate API connectivity and configuration
     * @private
     */
    async validateApiConnectivity() {
        try {
            console.log('[MCP Server] Validating API connectivity...');
            console.log('[MCP Server] Target API URL:', config.api.baseUrl);

            const response = await fetch(`${config.api.baseUrl}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) {
                console.warn(`[MCP Server] ⚠️  API health check failed: HTTP ${response.status}`);
                console.warn('[MCP Server] The API server may not be running or accessible');
                return;
            }

            const health = await response.json();
            console.log('[MCP Server] ✅ API connectivity validated');
            console.log('[MCP Server] API Version:', health.version);
            console.log('[MCP Server] Mempool Bridge:', health.features?.mempoolBridge ? 'Available' : 'Not Available');

            // Verify versioned endpoints are available
            if (health.endpoints?.v1?.mempool) {
                console.log('[MCP Server] ✅ Production mempool endpoints:', health.endpoints.v1.mempool);
            } else {
                console.warn('[MCP Server] ⚠️  Production mempool endpoints not found in health check');
            }
        } catch (error) {
            console.error('[MCP Server] ❌ API connectivity validation failed:', error.message);
            console.error('[MCP Server] Ensure the API server is running at:', config.api.baseUrl);
            console.error('[MCP Server] MCP server will continue but requests will fail');
        }
    }

    /**
     * Setup tool handlers for MCP server
     * @private
     */
    setupToolHandlers() {
        // List available tools - MEMPOOL ONLY
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'query_mempool_address',
                        description: 'Get detailed information about a Bitcoin address from mempool.space (x402 protected - ~$0.01 USDC)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                address: {
                                    type: 'string',
                                    description: 'Bitcoin address (P2PKH, P2SH, or Segwit)',
                                },
                            },
                            required: ['address'],
                        },
                    },
                    {
                        name: 'query_mempool_address_txs',
                        description: 'Get transaction history for a Bitcoin address (x402 protected - ~$0.01 USDC)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                address: {
                                    type: 'string',
                                    description: 'Bitcoin address to query transactions for',
                                },
                            },
                            required: ['address'],
                        },
                    },
                    {
                        name: 'query_mempool_transaction',
                        description: 'Get detailed transaction information from mempool.space (x402 protected - ~$0.01 USDC)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                txid: {
                                    type: 'string',
                                    description: 'Transaction ID (TXID) to query',
                                },
                            },
                            required: ['txid'],
                        },
                    },
                    {
                        name: 'query_mempool_tx_status',
                        description: 'Get transaction status and confirmation info (x402 protected - ~$0.01 USDC)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                txid: {
                                    type: 'string',
                                    description: 'Transaction ID (TXID) to check status',
                                },
                            },
                            required: ['txid'],
                        },
                    },
                    {
                        name: 'query_mempool_block',
                        description: 'Get block information and transactions (x402 protected - ~$0.01 USDC)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                block_hash: {
                                    type: 'string',
                                    description: 'Block hash or height to query',
                                },
                            },
                            required: ['block_hash'],
                        },
                    },
                    {
                        name: 'query_mempool_fees',
                        description: 'Get Bitcoin fee estimates for next block/1h/24h (x402 protected micropayment - $0.001 USDC)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                time_interval: {
                                    type: 'string',
                                    description: 'Time interval: "next" (default), "1h", "24h"',
                                },
                            },
                            required: [],
                        },
                    },
                    {
                        name: 'query_mempool_stats',
                        description: 'Get current mempool statistics (x402 protected micropayment - $0.001 USDC)',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: [],
                        },
                    },
                    {
                        name: 'query_mempool_height',
                        description: 'Get current Bitcoin block height (FREE - no payment required)',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: [],
                        },
                    },
                ],
            };
        });

        // Handle tool calls - MEMPOOL ONLY
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'query_mempool_address':
                        return await this.handleQueryMempoolAddress(/** @type {QueryMempoolAddressArgs} */ (args));

                    case 'query_mempool_address_txs':
                        return await this.handleQueryMempoolAddressTxs(/** @type {QueryMempoolAddressTxsArgs} */ (args));

                    case 'query_mempool_transaction':
                        return await this.handleQueryMempoolTransaction(/** @type {QueryMempoolTransactionArgs} */ (args));

                    case 'query_mempool_tx_status':
                        return await this.handleQueryMempoolTxStatus(/** @type {QueryMempoolTxStatusArgs} */ (args));

                    case 'query_mempool_block':
                        return await this.handleQueryMempoolBlock(/** @type {QueryMempoolBlockArgs} */ (args));

                    case 'query_mempool_fees':
                        return await this.handleQueryMempoolFees(/** @type {QueryMempoolFeesArgs} */ (args));

                    case 'query_mempool_stats':
                        return await this.handleQueryMempoolStats(/** @type {QueryMempoolStatsArgs} */ (args));

                    case 'query_mempool_height':
                        return await this.handleQueryMempoolHeight(/** @type {QueryMempoolHeightArgs} */ (args));

                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${name}`
                        );
                }
            } catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(
                    ErrorCode.InternalError,
                    `Tool execution failed: ${error.message}`
                );
            }
        });
    }

    /**
     * DEPRECATED: inscribe_ordinal - Removed, use mempool query tools instead
     * @private
     */
    // async handleInscribeOrdinal(args) {
    //     throw new McpError(
    //         ErrorCode.MethodNotFound,
    //         'inscribe_ordinal is deprecated. This MCP server now focuses on mempool.space queries with x402 Solana payments.'
    //     );
    // }

    /**
     * DEPRECATED: get_inscription_status - Removed, use mempool query tools instead
     * @private
     */
    // async handleGetInscriptionStatus(args) {
    //     throw new McpError(
    //         ErrorCode.MethodNotFound,
    //         'get_inscription_status is deprecated. This MCP server now focuses on mempool.space queries with x402 Solana payments.'
    //     );
    // }

    /**
     * DEPRECATED: list_inscriptions - Removed, use mempool query tools instead
     * @private
     */
    // async handleListInscriptions(args) {
    //     throw new McpError(
    //         ErrorCode.MethodNotFound,
    //         'list_inscriptions is deprecated. This MCP server now focuses on mempool.space queries with x402 Solana payments.'
    //     );
    // }

    /**
     * DEPRECATED: generate_bitcoin_address - Removed for security
     * @private
     */
    // async handleGenerateBitcoinAddress(args) {
    //     throw new McpError(
    //         ErrorCode.MethodNotFound,
    //         'generate_bitcoin_address is deprecated. Use mempool query tools instead for Bitcoin data access.'
    //     );
    // }

    /**
     * DEPRECATED: validate_bitcoin_address - Removed
     * @private
     */
    // async handleValidateBitcoinAddress(args) {
    //     throw new McpError(
    //         ErrorCode.MethodNotFound,
    //         'validate_bitcoin_address is deprecated. Use mempool query tools instead.'
    //     );
    // }

    /**
     * Handle query_mempool_address tool call
     * Get detailed address information from mempool.space with x402 payment
     * @param {QueryMempoolAddressArgs} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleQueryMempoolAddress(args) {
        if (!this.httpClient) {
            throw new McpError(
                ErrorCode.InternalError,
                'Payment client not initialized. Cannot make paid mempool queries.'
            );
        }

        try {
            console.log('[MCP Server] Querying mempool address:', args.address);

            const result = await makePaidRequest(
                this.httpClient,
                `/api/v1/mempool/address/${args.address}`,
                {}
            );

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            address: args.address,
                            data: result.data,
                            payment: {
                                amount: '~$0.01 USDC',
                                method: 'x402',
                                status: 'settled',
                            },
                        }, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('[MCP Server] Address query failed:', error.message);
            const mcpError = parseHttpError(error, `/api/mempool/address/${args.address}`);
            throw mcpError;
        }
    }

    /**
     * Handle query_mempool_address_txs tool call
     * Get transaction history for an address with x402 payment
     * @param {QueryMempoolAddressTxsArgs} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleQueryMempoolAddressTxs(args) {
        if (!this.httpClient) {
            throw new McpError(
                ErrorCode.InternalError,
                'Payment client not initialized. Cannot make paid mempool queries.'
            );
        }

        try {
            console.log('[MCP Server] Querying transactions for address:', args.address);

            const result = await makePaidRequest(
                this.httpClient,
                `/api/v1/mempool/address/${args.address}/txs`,
                {}
            );

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            address: args.address,
                            transactions: result.data,
                            count: Array.isArray(result.data) ? result.data.length : 0,
                            payment: {
                                amount: '~$0.01 USDC',
                                method: 'x402',
                                status: 'settled',
                            },
                        }, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('[MCP Server] Transaction query failed:', error.message);
            const mcpError = parseHttpError(error, `/api/mempool/address/${args.address}/txs`);
            throw mcpError;
        }
    }

    /**
     * Handle query_mempool_transaction tool call
     * Get detailed transaction information with x402 payment
     * @param {QueryMempoolTransactionArgs} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleQueryMempoolTransaction(args) {
        if (!this.httpClient) {
            throw new McpError(
                ErrorCode.InternalError,
                'Payment client not initialized. Cannot make paid mempool queries.'
            );
        }

        try {
            console.log('[MCP Server] Querying transaction:', args.txid);

            const result = await makePaidRequest(
                this.httpClient,
                `/api/v1/mempool/tx/${args.txid}`,
                {}
            );

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            txid: args.txid,
                            transaction: result.data,
                            payment: {
                                amount: '~$0.01 USDC',
                                method: 'x402',
                                status: 'settled',
                            },
                        }, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('[MCP Server] Transaction query failed:', error.message);
            const mcpError = parseHttpError(error, `/api/mempool/tx/${args.txid}`);
            throw mcpError;
        }
    }

    /**
     * Handle query_mempool_tx_status tool call
     * Get transaction confirmation status with x402 payment
     * @param {QueryMempoolTxStatusArgs} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleQueryMempoolTxStatus(args) {
        if (!this.httpClient) {
            throw new McpError(
                ErrorCode.InternalError,
                'Payment client not initialized. Cannot make paid mempool queries.'
            );
        }

        try {
            console.log('[MCP Server] Querying transaction status:', args.txid);

            const result = await makePaidRequest(
                this.httpClient,
                `/api/v1/mempool/tx/${args.txid}/status`,
                {}
            );

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            txid: args.txid,
                            status: result.data,
                            payment: {
                                amount: '~$0.01 USDC',
                                method: 'x402',
                                status: 'settled',
                            },
                        }, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('[MCP Server] Status query failed:', error.message);
            const mcpError = parseHttpError(error, `/api/mempool/tx/${args.txid}/status`);
            throw mcpError;
        }
    }

    /**
     * Handle query_mempool_block tool call
     * Get block information with x402 payment
     * @param {QueryMempoolBlockArgs} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleQueryMempoolBlock(args) {
        if (!this.httpClient) {
            throw new McpError(
                ErrorCode.InternalError,
                'Payment client not initialized. Cannot make paid mempool queries.'
            );
        }

        try {
            console.log('[MCP Server] Querying block:', args.block_hash);

            const result = await makePaidRequest(
                this.httpClient,
                `/api/v1/mempool/block/${args.block_hash}`,
                {}
            );

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            block: args.block_hash,
                            data: result.data,
                            payment: {
                                amount: '~$0.01 USDC',
                                method: 'x402',
                                status: 'settled',
                            },
                        }, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('[MCP Server] Block query failed:', error.message);
            const mcpError = parseHttpError(error, `/api/mempool/block/${args.block_hash}`);
            throw mcpError;
        }
    }

    /**
     * Handle query_mempool_fees tool call
     * Get fee estimates with x402 micropayment
     * @param {QueryMempoolFeesArgs} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleQueryMempoolFees(args) {
        if (!this.httpClient) {
            throw new McpError(
                ErrorCode.InternalError,
                'Payment client not initialized. Cannot make paid mempool queries.'
            );
        }

        try {
            const interval = args.time_interval || 'next';
            console.log('[MCP Server] Querying fees for interval:', interval);

            const result = await makePaidRequest(
                this.httpClient,
                `/api/v1/mempool/fees/${interval}`,
                {}
            );

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            interval: interval,
                            fees: result.data,
                            payment: {
                                amount: '$0.001 USDC',
                                method: 'x402',
                                type: 'micropayment',
                                status: 'settled',
                            },
                        }, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('[MCP Server] Fee query failed:', error.message);
            const interval = args.time_interval || 'next';
            const mcpError = parseHttpError(error, `/api/mempool/fees/${interval}`);
            throw mcpError;
        }
    }

    /**
     * Handle query_mempool_stats tool call
     * Get mempool statistics with x402 micropayment
     * @param {QueryMempoolStatsArgs} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleQueryMempoolStats(args) {
        if (!this.httpClient) {
            throw new McpError(
                ErrorCode.InternalError,
                'Payment client not initialized. Cannot make paid mempool queries.'
            );
        }

        try {
            console.log('[MCP Server] Querying mempool statistics');

            const result = await makePaidRequest(
                this.httpClient,
                '/api/v1/mempool/stats',
                {}
            );

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            stats: result.data,
                            payment: {
                                amount: '$0.001 USDC',
                                method: 'x402',
                                type: 'micropayment',
                                status: 'settled',
                            },
                        }, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('[MCP Server] Stats query failed:', error.message);
            const mcpError = parseHttpError(error, '/api/mempool/stats');
            throw mcpError;
        }
    }

    /**
     * Handle query_mempool_height tool call
     * Get current block height (FREE - no payment required)
     * @param {QueryMempoolHeightArgs} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleQueryMempoolHeight(args) {
        try {
            console.log('[MCP Server] Querying current block height');

            // FREE endpoint - call local API for consistency and monitoring
            const response = await fetch(`${config.api.baseUrl}/api/v1/mempool/height`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            height: result.height,
                            network: result.network,
                            payment: {
                                amount: 'FREE',
                                method: 'local_api',
                                status: 'none',
                            },
                        }, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('[MCP Server] Height query failed:', error.message);
            const mcpError = parseHttpError(error, '/api/v1/mempool/height');
            throw mcpError;
        }
    }

    /**
     * Setup error handling
     * @private
     */
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Server Error]:', error);
        };

        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    /**
     * Start the MCP server
     */
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);

        console.log('Engrave Protocol MCP Server started - Mempool x402 Edition');
        console.log('Production-ready Bitcoin blockchain data via mempool.space');
        console.log('');
        console.log('Available tools (x402 Solana payments):');
        console.log('  - query_mempool_address: Get address info (~$0.01 USDC)');
        console.log('  - query_mempool_address_txs: Get address transactions (~$0.01 USDC)');
        console.log('  - query_mempool_transaction: Get transaction details (~$0.01 USDC)');
        console.log('  - query_mempool_tx_status: Get transaction status (~$0.01 USDC)');
        console.log('  - query_mempool_block: Get block information (~$0.01 USDC)');
        console.log('  - query_mempool_fees: Get fee estimates ($0.001 USDC micropayment)');
        console.log('  - query_mempool_stats: Get mempool statistics ($0.001 USDC micropayment)');
        console.log('  - query_mempool_height: Get current block height (FREE)');
        console.log('');
        console.log('Payment method: x402 protocol via Solana wallet');
    }
}

// Export for use in other modules
export { EngraveProtocolMCPServer };

// If this file is run directly, start the server
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new EngraveProtocolMCPServer();
    server.start().catch(console.error);
}