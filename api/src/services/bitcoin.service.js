// @ts-check
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import crypto from 'crypto';

// Initialize BIP32 with secp256k1
const bip32 = BIP32Factory(ecc);

/**
 * Bitcoin Wallet Service
 * Handles Bitcoin wallet operations, address generation, and transaction signing
 */

/**
 * @typedef {Object} BitcoinAddress
 * @property {string} address - The Bitcoin address
 * @property {string} privateKey - The private key (WIF format)
 * @property {string} publicKey - The public key (hex)
 */

/**
 * @typedef {Object} BitcoinTransaction
 * @property {string} txid - Transaction ID
 * @property {string} hex - Raw transaction hex
 * @property {number} size - Transaction size in bytes
 */

class BitcoinService {
    constructor() {
        /** @private */
        this.network = this.getNetwork();
        
        /** @private */
        this.masterKey = null;
        
        console.log(`[BITCOIN] Initialized for ${this.network === bitcoin.networks.testnet ? 'testnet' : 'mainnet'}`);
    }

    /**
     * Get Bitcoin network configuration
     * @returns {bitcoin.Network}
     * @private
     */
    getNetwork() {
        const networkType = process.env.BITCOIN_NETWORK || 'testnet';
        return networkType === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
    }

    /**
     * Initialize or load master key for HD wallet
     * @param {string} [seed] - Optional seed phrase (hex). If not provided, generates new one
     * @returns {Promise<string>} - Returns the master key seed (hex)
     */
    async initializeMasterKey(seed) {
        if (seed) {
            // Load from provided seed
            const seedBuffer = Buffer.from(seed, 'hex');
            this.masterKey = bip32.fromSeed(seedBuffer, this.network);
        } else {
            // Generate new seed
            const seedBuffer = crypto.randomBytes(32);
            this.masterKey = bip32.fromSeed(seedBuffer, this.network);
            seed = seedBuffer.toString('hex');
        }
        
        console.log(`[BITCOIN] Master key initialized`);
        return seed;
    }

    /**
     * Generate a new Bitcoin address for inscriptions
     * @param {number} [index=0] - Derivation index for HD wallet
     * @returns {Promise<BitcoinAddress>}
     */
    async generateAddress(index = 0) {
        if (!this.masterKey) {
            throw new Error('Master key not initialized. Call initializeMasterKey() first.');
        }

        // Derive child key using BIP44 path: m/44'/0'/0'/0/index
        // For testnet: m/44'/1'/0'/0/index
        const coinType = this.network === bitcoin.networks.testnet ? 1 : 0;
        const path = `m/44'/${coinType}'/0'/0/${index}`;
        
        const child = this.masterKey.derivePath(path);
        
        // Generate P2WPKH (native segwit) address
        const { address } = bitcoin.payments.p2wpkh({
            pubkey: child.publicKey,
            network: this.network,
        });

        if (!address) {
            throw new Error('Failed to generate Bitcoin address');
        }

        return {
            address,
            privateKey: child.toWIF(),
            publicKey: child.publicKey.toString('hex'),
        };
    }

    /**
     * Import Bitcoin address from private key
     * @param {string} privateKeyWIF - Private key in WIF format
     * @returns {BitcoinAddress}
     */
    importFromPrivateKey(privateKeyWIF) {
        const keyPair = bitcoin.ECPair.fromWIF(privateKeyWIF, this.network);
        
        const { address } = bitcoin.payments.p2wpkh({
            pubkey: keyPair.publicKey,
            network: this.network,
        });

        if (!address) {
            throw new Error('Failed to generate address from private key');
        }

        return {
            address,
            privateKey: privateKeyWIF,
            publicKey: keyPair.publicKey.toString('hex'),
        };
    }

    /**
     * Validate Bitcoin address
     * @param {string} address - Bitcoin address to validate
     * @returns {boolean}
     */
    validateAddress(address) {
        try {
            bitcoin.address.toOutputScript(address, this.network);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Create and sign a Bitcoin transaction
     * @param {Object} params - Transaction parameters
     * @param {Array<{txid: string, vout: number, value: number}>} params.inputs - UTXOs to spend
     * @param {Array<{address: string, value: number}>} params.outputs - Outputs
     * @param {string} params.privateKeyWIF - Private key for signing
     * @param {number} [params.feeRate=10] - Fee rate in sat/vB
     * @returns {Promise<BitcoinTransaction>}
     */
    async createTransaction({ inputs, outputs, privateKeyWIF, feeRate = 10 }) {
        const keyPair = bitcoin.ECPair.fromWIF(privateKeyWIF, this.network);
        const psbt = new bitcoin.Psbt({ network: this.network });

        // Add inputs
        for (const input of inputs) {
            // For P2WPKH inputs, we need the previous transaction output script
            const { address } = bitcoin.payments.p2wpkh({
                pubkey: keyPair.publicKey,
                network: this.network,
            });

            if (!address) {
                throw new Error('Failed to generate address for transaction input');
            }

            psbt.addInput({
                hash: input.txid,
                index: input.vout,
                witnessUtxo: {
                    script: bitcoin.address.toOutputScript(address, this.network),
                    value: input.value,
                },
            });
        }

        // Add outputs
        for (const output of outputs) {
            psbt.addOutput({
                address: output.address,
                value: output.value,
            });
        }

        // Sign all inputs
        for (let i = 0; i < inputs.length; i++) {
            psbt.signInput(i, keyPair);
        }

        // Finalize and extract transaction
        psbt.finalizeAllInputs();
        const tx = psbt.extractTransaction();

        return {
            txid: tx.getId(),
            hex: tx.toHex(),
            size: tx.byteLength(),
        };
    }

    /**
     * Get estimated transaction fee
     * @param {number} inputCount - Number of inputs
     * @param {number} outputCount - Number of outputs
     * @param {number} [feeRate=10] - Fee rate in sat/vB
     * @returns {number} - Estimated fee in satoshis
     */
    estimateTransactionFee(inputCount, outputCount, feeRate = 10) {
        // Rough estimation for P2WPKH transactions
        // Input: ~68 vBytes, Output: ~31 vBytes, Overhead: ~11 vBytes
        const estimatedSize = (inputCount * 68) + (outputCount * 31) + 11;
        return Math.ceil(estimatedSize * feeRate);
    }

    /**
     * Convert satoshis to BTC
     * @param {number} satoshis
     * @returns {number}
     */
    satoshisToBTC(satoshis) {
        return satoshis / 100000000;
    }

    /**
     * Convert BTC to satoshis
     * @param {number} btc
     * @returns {number}
     */
    btcToSatoshis(btc) {
        return Math.round(btc * 100000000);
    }

    /**
     * Get network info
     * @returns {Object}
     */
    getNetworkInfo() {
        return {
            network: this.network === bitcoin.networks.testnet ? 'testnet' : 'mainnet',
            isTestnet: this.network === bitcoin.networks.testnet,
            bech32Prefix: this.network.bech32,
        };
    }
}

// Export singleton instance
export const bitcoinService = new BitcoinService();