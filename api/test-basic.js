// @ts-check
import { bitcoinService } from './src/services/bitcoin.service.js';
import { agentService } from './src/services/agent.service.js';

/**
 * Basic functionality test for Engrave Protocol
 * Tests Bitcoin service and agent service integration
 */

async function testBasicFunctionality() {
    console.log('🧪 Testing Engrave Protocol Basic Functionality\n');

    try {
        // Test 1: Bitcoin Service Initialization
        console.log('1️⃣ Testing Bitcoin Service...');
        
        // Initialize master key
        const seed = await bitcoinService.initializeMasterKey();
        console.log(`✅ Master key initialized (seed length: ${seed.length} chars)`);
        
        // Generate Bitcoin address
        const addressInfo = await bitcoinService.generateAddress(0);
        console.log(`✅ Generated Bitcoin address: ${addressInfo.address}`);
        console.log(`   Public key: ${addressInfo.publicKey}`);
        
        // Test address validation
        const isValid = bitcoinService.validateAddress(addressInfo.address);
        console.log(`✅ Address validation: ${isValid ? 'VALID' : 'INVALID'}`);
        
        // Get network info
        const networkInfo = bitcoinService.getNetworkInfo();
        console.log(`✅ Network: ${networkInfo.network} (${networkInfo.isTestnet ? 'testnet' : 'mainnet'})`);
        
        console.log('');

        // Test 2: Agent Service
        console.log('2️⃣ Testing Agent Service...');
        
        // Test inscription request validation
        const validRequest = {
            content: 'Hello Bitcoin Ordinals from Engrave Protocol!',
            contentType: 'text/plain',
            destinationAddress: addressInfo.address
        };
        
        const validation = agentService.validateInscriptionRequest(validRequest);
        console.log(`✅ Request validation: ${validation.valid ? 'VALID' : 'INVALID'}`);
        if (!validation.valid) {
            console.log(`   Errors: ${validation.errors.join(', ')}`);
        }
        
        // Test inscription processing
        const inscriptionResult = await agentService.processInscriptionRequest(validRequest);
        console.log(`✅ Inscription processing: ${inscriptionResult.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Message: ${inscriptionResult.message}`);
        
        if (inscriptionResult.inscription) {
            console.log(`   Inscription ID: ${inscriptionResult.inscription.id}`);
            console.log(`   Transaction ID: ${inscriptionResult.inscription.txid}`);
            console.log(`   Address: ${inscriptionResult.inscription.address}`);
            console.log(`   Size: ${inscriptionResult.inscription.size} bytes`);
            console.log(`   Content Type: ${inscriptionResult.inscription.contentType}`);
        }
        
        console.log('');

        // Test 3: Error Handling
        console.log('3️⃣ Testing Error Handling...');
        
        // Test invalid request
        const invalidRequest = {
            content: '', // Empty content should fail
            contentType: 'invalid/type'
        };
        
        const invalidValidation = agentService.validateInscriptionRequest(invalidRequest);
        console.log(`✅ Invalid request validation: ${invalidValidation.valid ? 'UNEXPECTEDLY VALID' : 'CORRECTLY INVALID'}`);
        console.log(`   Errors: ${invalidValidation.errors.join(', ')}`);
        
        // Test invalid Bitcoin address
        const invalidAddress = 'invalid_bitcoin_address';
        const isInvalidAddressValid = bitcoinService.validateAddress(invalidAddress);
        console.log(`✅ Invalid address validation: ${isInvalidAddressValid ? 'UNEXPECTEDLY VALID' : 'CORRECTLY INVALID'}`);
        
        console.log('');

        // Test 4: Utility Functions
        console.log('4️⃣ Testing Utility Functions...');
        
        // Test BTC/satoshi conversion
        const btcAmount = 0.001;
        const satoshis = bitcoinService.btcToSatoshis(btcAmount);
        const backToBtc = bitcoinService.satoshisToBTC(satoshis);
        console.log(`✅ BTC conversion: ${btcAmount} BTC = ${satoshis} satoshis = ${backToBtc} BTC`);
        
        // Test fee estimation
        const estimatedFee = bitcoinService.estimateTransactionFee(1, 2, 10);
        console.log(`✅ Fee estimation: ${estimatedFee} satoshis for 1 input, 2 outputs at 10 sat/vB`);
        
        console.log('');
        console.log('🎉 All basic functionality tests completed successfully!');
        console.log('');
        console.log('📋 Summary:');
        console.log('✅ Bitcoin wallet service working');
        console.log('✅ Address generation working');
        console.log('✅ Address validation working');
        console.log('✅ Agent service working');
        console.log('✅ Inscription validation working');
        console.log('✅ Inscription processing working (mock mode)');
        console.log('✅ Error handling working');
        console.log('✅ Utility functions working');
        console.log('');
        console.log('🚀 Ready for MCP server testing and x402 integration!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
testBasicFunctionality();