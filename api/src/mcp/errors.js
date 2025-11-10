// @ts-check
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Payment Error Handling for MCP Server
 * Defines custom error types for payment-related failures
 */

/**
 * Create an MCP error for insufficient funds
 * @param {string} walletAddress - Wallet address that lacks funds
 * @param {string} [requiredAmount] - Required amount in human-readable format
 * @returns {McpError} MCP formatted error
 */
export function createInsufficientFundsError(walletAddress, requiredAmount = '$1.00 USDC') {
	return new McpError(
		ErrorCode.InternalError,
		`Insufficient funds in wallet ${walletAddress}. ` +
		`Required: ${requiredAmount}. ` +
		`Please fund your wallet at https://faucet.circle.com`
	);
}

/**
 * Create an MCP error for payment verification failure
 * @param {string} [reason] - Reason for payment failure
 * @returns {McpError} MCP formatted error
 */
export function createPaymentVerificationError(reason = 'Payment signature verification failed') {
	return new McpError(
		ErrorCode.InternalError,
		`Payment verification failed: ${reason}. ` +
		`Please ensure your wallet has sufficient USDC balance and try again.`
	);
}

/**
 * Create an MCP error for network connectivity issues
 * @param {string} endpoint - Endpoint that failed
 * @param {string} [details] - Additional error details
 * @returns {McpError} MCP formatted error
 */
export function createNetworkError(endpoint, details = '') {
	return new McpError(
		ErrorCode.InternalError,
		`Failed to connect to API server at ${endpoint}. ` +
		`${details ? `Details: ${details}. ` : ''}` +
		`Please ensure the API server is running at ${endpoint}.`
	);
}

/**
 * Create an MCP error for payment settlement failure
 * @param {string} [transactionHash] - Transaction hash if available
 * @returns {McpError} MCP formatted error
 */
export function createSettlementError(transactionHash) {
	return new McpError(
		ErrorCode.InternalError,
		`Payment settlement failed. ` +
		`${transactionHash ? `Transaction: ${transactionHash}. ` : ''}` +
		`The payment was initiated but could not be settled. Please contact support.`
	);
}

/**
 * Create an MCP error for invalid payment configuration
 * @param {string} configIssue - Description of the configuration issue
 * @returns {McpError} MCP formatted error
 */
export function createConfigurationError(configIssue) {
	return new McpError(
		ErrorCode.InvalidRequest,
		`Payment configuration error: ${configIssue}. ` +
		`Please check your environment variables and MCP server configuration.`
	);
}

/**
 * Parse HTTP error and convert to appropriate MCP error
 * @param {Error} error - Original error from HTTP request
 * @param {string} endpoint - Endpoint that was called
 * @returns {McpError} MCP formatted error
 */
export function parseHttpError(error, endpoint) {
	// Check if it's an axios error with response
	if (error.response) {
		const status = error.response.status;
		const data = error.response.data;

		switch (status) {
			case 402:
				// Payment required - could be insufficient funds or invalid payment
				if (data?.error?.includes('insufficient') || data?.error?.includes('balance')) {
					return createInsufficientFundsError('MCP wallet', '$1.00 USDC');
				}
				return createPaymentVerificationError(data?.message || data?.error);

			case 404:
				return new McpError(
					ErrorCode.InvalidRequest,
					`Endpoint not found: ${endpoint}. Please ensure the API server is running correctly.`
				);

			case 500:
				return new McpError(
					ErrorCode.InternalError,
					`API server error: ${data?.message || data?.error || 'Unknown error'}. ` +
					`Please try again or contact support.`
				);

			default:
				return new McpError(
					ErrorCode.InternalError,
					`HTTP ${status} error: ${data?.message || data?.error || 'Unknown error'}`
				);
		}
	}

	// Network error (no response)
	if (error.request) {
		return createNetworkError(endpoint, error.message);
	}

	// Other errors
	return new McpError(
		ErrorCode.InternalError,
		`Unexpected error: ${error.message}`
	);
}

/**
 * Check if error is a payment-related error
 * @param {Error} error - Error to check
 * @returns {boolean} True if payment-related
 */
export function isPaymentError(error) {
	if (!error.message) return false;

	const paymentKeywords = [
		'insufficient funds',
		'payment',
		'balance',
		'402',
		'verification failed',
		'settlement failed',
	];

	const message = error.message.toLowerCase();
	return paymentKeywords.some(keyword => message.includes(keyword));
}

/**
 * Get user-friendly error message for logging
 * @param {McpError} error - MCP error
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error) {
	if (error instanceof McpError) {
		return error.message;
	}
	return 'An unexpected error occurred. Please try again.';
}
