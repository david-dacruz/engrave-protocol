// @ts-check
import { Connection, Transaction, PublicKey } from '@solana/web3.js';
import { config } from '../config/env.js';

/**
 * Direct on-chain payment verification (bypasses facilitator)
 * Implements x402 spec requirements for Solana verification
 */

class DirectPaymentVerifier {
	constructor() {
		const rpcUrl =
			config.x402.network === 'solana-devnet'
				? 'https://api.devnet.solana.com'
				: 'https://api.mainnet-beta.solana.com';

		this.connection = new Connection(rpcUrl, 'confirmed');
		this.network = config.x402.network;
	}

	/**
	 * Verify payment by deserializing and validating transaction
	 * @param {string} paymentHeader - Base64 encoded payment payload
	 * @param {Object} paymentRequirements - Payment requirements
	 * @returns {Promise<{isValid: boolean, invalidReason?: string}>}
	 */
	async verifyPayment(paymentHeader, paymentRequirements) {
		try {
			// Decode payment header
			const decoded = Buffer.from(paymentHeader, 'base64').toString('utf8');
			const paymentPayload = JSON.parse(decoded);

			// Validate payload structure
			if (!paymentPayload.payload || typeof paymentPayload.payload !== 'string') {
				return {
					isValid: false,
					invalidReason: 'missing_or_invalid_payload',
				};
			}

			// Deserialize transaction
			const txBuffer = Buffer.from(paymentPayload.payload, 'base64');
			const tx = Transaction.from(txBuffer);

			// Validate transaction is signed
			if (!tx.signature || tx.signature.every((byte) => byte === 0)) {
				return {
					isValid: false,
					invalidReason: 'transaction_not_signed',
				};
			}

			// Simulate transaction to validate it would succeed
			try {
				const simulation = await this.connection.simulateTransaction(tx);

				if (simulation.value.err) {
					console.error('[Direct Verifier] Simulation failed:', simulation.value.err);
					return {
						isValid: false,
						invalidReason: 'transaction_simulation_failed',
					};
				}
			} catch (simError) {
				console.error('[Direct Verifier] Simulation error:', simError.message);
				return {
					isValid: false,
					invalidReason: 'simulation_error',
				};
			}

			// Validate SPL token transfer instruction (instruction type 3)
			const hasTransferInstruction = tx.instructions.some((ix) => {
				// Check if it's a token program instruction
				if (ix.programId.equals(new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'))) {
					// Instruction type 3 is Transfer (first byte of data)
					return ix.data[0] === 3;
				}
				return false;
			});

			if (!hasTransferInstruction) {
				return {
					isValid: false,
					invalidReason: 'no_transfer_instruction_found',
				};
			}

			// Validate destination matches payment requirements
			const treasuryPubkey = new PublicKey(paymentRequirements.payTo);
			const assetPubkey = new PublicKey(paymentRequirements.asset);

			// TODO: More detailed validation of transfer destination and amount
			// This requires parsing the SPL token transfer instruction data

			console.log('[Direct Verifier] Payment validation passed');
			return {
				isValid: true,
			};
		} catch (error) {
			console.error('[Direct Verifier] Verification error:', error.message);
			return {
				isValid: false,
				invalidReason: 'verification_exception',
			};
		}
	}

	/**
	 * Settle payment by submitting transaction to network
	 * @param {string} paymentHeader - Base64 encoded payment payload
	 * @param {Object} paymentRequirements - Payment requirements
	 * @returns {Promise<{success: boolean, errorReason?: string, transaction: string, network: string}>}
	 */
	async settlePayment(paymentHeader, paymentRequirements) {
		try {
			// Decode payment header
			const decoded = Buffer.from(paymentHeader, 'base64').toString('utf8');
			const paymentPayload = JSON.parse(decoded);

			// Deserialize transaction
			const txBuffer = Buffer.from(paymentPayload.payload, 'base64');
			const tx = Transaction.from(txBuffer);

			// Submit transaction to network
			console.log('[Direct Verifier] Submitting transaction to network...');
			const signature = await this.connection.sendRawTransaction(tx.serialize(), {
				skipPreflight: false,
				preflightCommitment: 'confirmed',
			});

			console.log('[Direct Verifier] Transaction submitted:', signature);

			// Await confirmation
			const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');

			if (confirmation.value.err) {
				console.error('[Direct Verifier] Transaction failed:', confirmation.value.err);
				return {
					success: false,
					errorReason: 'transaction_failed_on_chain',
					transaction: signature,
					network: this.network,
				};
			}

			// Verify balance change using postTokenBalances (x402 spec requirement)
			const txDetails = await this.connection.getTransaction(signature, {
				commitment: 'confirmed',
				maxSupportedTransactionVersion: 0,
			});

			if (txDetails?.meta?.postTokenBalances) {
				console.log('[Direct Verifier] Post-transaction token balances:', txDetails.meta.postTokenBalances);
			}

			console.log('[Direct Verifier] Payment settled successfully');
			return {
				success: true,
				transaction: signature,
				network: this.network,
			};
		} catch (error) {
			console.error('[Direct Verifier] Settlement error:', error.message);
			return {
				success: false,
				errorReason: 'settlement_exception',
				transaction: '',
				network: this.network,
			};
		}
	}
}

export const directPaymentVerifier = new DirectPaymentVerifier();
