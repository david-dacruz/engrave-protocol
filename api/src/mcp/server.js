// @ts-check
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { agentService } from '../services/agent.service.js';
import { bitcoinService } from '../services/bitcoin.service.js';

/**
 * Engrave Protocol MCP Server
 * Provides Bitcoin Ordinals inscription tools for AI agents
 */

/**
 * @typedef {Object} InscribeOrdinalArgs
 * @property {string} content - Content to inscribe
 * @property {string} [content_type] - MIME type (default: text/plain)
 * @property {string} [destination_address] - Bitcoin address for inscription
 */

/**
 * @typedef {Object} GetInscriptionStatusArgs
 * @property {string} inscription_id - Inscription ID to check
 */

/**
 * @typedef {Object} ListInscriptionsArgs
 * @property {string} address - Bitcoin address to list inscriptions for
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

        this.setupToolHandlers();
        this.setupErrorHandling();
    }

    /**
     * Setup tool handlers for MCP server
     * @private
     */
    setupToolHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'inscribe_ordinal',
                        description: 'Create a Bitcoin Ordinals inscription with paid x402 endpoint',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                content: {
                                    type: 'string',
                                    description: 'Content to inscribe on Bitcoin (max 400KB)',
                                },
                                content_type: {
                                    type: 'string',
                                    description: 'MIME type of the content (default: text/plain)',
                                    enum: [
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
                                },
                                destination_address: {
                                    type: 'string',
                                    description: 'Bitcoin address to receive the inscription (optional)',
                                },
                            },
                            required: ['content'],
                        },
                    },
                    {
                        name: 'get_inscription_status',
                        description: 'Get the status of a Bitcoin Ordinals inscription',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                inscription_id: {
                                    type: 'string',
                                    description: 'The inscription ID to check status for',
                                },
                            },
                            required: ['inscription_id'],
                        },
                    },
                    {
                        name: 'list_inscriptions',
                        description: 'List Bitcoin Ordinals inscriptions for a given address',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                address: {
                                    type: 'string',
                                    description: 'Bitcoin address to list inscriptions for',
                                },
                            },
                            required: ['address'],
                        },
                    },
                    {
                        name: 'generate_bitcoin_address',
                        description: 'Generate a new Bitcoin address for inscriptions',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                index: {
                                    type: 'number',
                                    description: 'Derivation index for HD wallet (default: 0)',
                                },
                            },
                            required: [],
                        },
                    },
                    {
                        name: 'validate_bitcoin_address',
                        description: 'Validate a Bitcoin address',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                address: {
                                    type: 'string',
                                    description: 'Bitcoin address to validate',
                                },
                            },
                            required: ['address'],
                        },
                    },
                ],
            };
        });

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'inscribe_ordinal':
                        return await this.handleInscribeOrdinal(/** @type {InscribeOrdinalArgs} */ (args));

                    case 'get_inscription_status':
                        return await this.handleGetInscriptionStatus(/** @type {GetInscriptionStatusArgs} */ (args));

                    case 'list_inscriptions':
                        return await this.handleListInscriptions(/** @type {ListInscriptionsArgs} */ (args));

                    case 'generate_bitcoin_address':
                        return await this.handleGenerateBitcoinAddress(args);

                    case 'validate_bitcoin_address':
                        return await this.handleValidateBitcoinAddress(args);

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
     * Handle inscribe_ordinal tool call
     * @param {InscribeOrdinalArgs} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleInscribeOrdinal(args) {
        const requestBody = {
            content: args.content,
            contentType: args.content_type,
            destinationAddress: args.destination_address,
        };

        const result = await agentService.processInscriptionRequest(requestBody);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: result.success,
                        message: result.message,
                        inscription: result.inscription,
                        note: 'This endpoint requires x402 payment of $1.00 USDC. The inscription creation is currently in mock mode for development.',
                    }, null, 2),
                },
            ],
        };
    }

    /**
     * Handle get_inscription_status tool call
     * @param {GetInscriptionStatusArgs} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleGetInscriptionStatus(args) {
        const status = await agentService.getInscriptionStatus(args.inscription_id);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(status, null, 2),
                },
            ],
        };
    }

    /**
     * Handle list_inscriptions tool call
     * @param {ListInscriptionsArgs} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleListInscriptions(args) {
        // Validate Bitcoin address first
        if (!bitcoinService.validateAddress(args.address)) {
            throw new McpError(
                ErrorCode.InvalidParams,
                `Invalid Bitcoin address: ${args.address}`
            );
        }

        const inscriptions = await agentService.listInscriptionsByAddress(args.address);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        address: args.address,
                        inscriptions: inscriptions,
                        count: inscriptions.length,
                    }, null, 2),
                },
            ],
        };
    }

    /**
     * Handle generate_bitcoin_address tool call
     * @param {Object} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleGenerateBitcoinAddress(args) {
        // Initialize master key if not already done
        if (!bitcoinService.masterKey) {
            await bitcoinService.initializeMasterKey();
        }

        const index = args.index || 0;
        const addressInfo = await bitcoinService.generateAddress(index);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        address: addressInfo.address,
                        publicKey: addressInfo.publicKey,
                        index: index,
                        network: bitcoinService.getNetworkInfo().network,
                        note: 'Private key is not returned for security reasons',
                    }, null, 2),
                },
            ],
        };
    }

    /**
     * Handle validate_bitcoin_address tool call
     * @param {Object} args
     * @returns {Promise<Object>}
     * @private
     */
    async handleValidateBitcoinAddress(args) {
        const isValid = bitcoinService.validateAddress(args.address);
        const networkInfo = bitcoinService.getNetworkInfo();

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        address: args.address,
                        valid: isValid,
                        network: networkInfo.network,
                        message: isValid 
                            ? `Valid Bitcoin address for ${networkInfo.network}` 
                            : `Invalid Bitcoin address for ${networkInfo.network}`,
                    }, null, 2),
                },
            ],
        };
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
        
        console.log('🪶 Engrave Protocol MCP Server started');
        console.log('Available tools:');
        console.log('  - inscribe_ordinal: Create Bitcoin Ordinals inscriptions (x402 paid)');
        console.log('  - get_inscription_status: Check inscription status');
        console.log('  - list_inscriptions: List inscriptions by address');
        console.log('  - generate_bitcoin_address: Generate new Bitcoin address');
        console.log('  - validate_bitcoin_address: Validate Bitcoin address');
    }
}

// Export for use in other modules
export { EngraveProtocolMCPServer };

// If this file is run directly, start the server
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new EngraveProtocolMCPServer();
    server.start().catch(console.error);
}