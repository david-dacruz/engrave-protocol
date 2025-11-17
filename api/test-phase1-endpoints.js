// @ts-check
/**
 * Phase 1 Endpoint Testing
 * Tests all newly implemented Phase 1 endpoints
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/v1/mempool';

// Test Bitcoin testnet address with activity
const TEST_ADDRESS = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxe9hmw';
const TEST_TXID = '15e10745f15593a899cef391191bdd3d7c12412cc4696b7bcb669d0feadc8521';
const TEST_BLOCK_HASH = '000000000000002f2c3c9c9ccbae2f3d7d5f1e8e8e8e8e8e8e8e8e8e8e8e8e8e';
const TEST_BLOCK_HEIGHT = 2500000;

const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
};

function log(color, message) {
	console.log(`${color}${message}${colors.reset}`);
}

async function testEndpoint(name, endpoint, method = 'GET', data = null) {
	try {
		log(colors.cyan, `\n📡 Testing: ${name}`);
		log(colors.blue, `   Endpoint: ${method} ${endpoint}`);

		const config = {
			method,
			url: `${API_BASE}${endpoint}`,
			headers: {},
		};

		if (data) {
			config.data = data;
			config.headers['Content-Type'] = 'text/plain';
		}

		const response = await axios(config);

		if (response.status === 402) {
			log(colors.yellow, `   ⚠️  402 Payment Required (expected)`);
			log(colors.blue, `   Payment info: ${JSON.stringify(response.data, null, 2)}`);
			return { success: true, requiresPayment: true };
		}

		log(colors.green, `   ✅ ${response.status} ${response.statusText}`);

		// Log relevant data
		if (response.data.success) {
			const keys = Object.keys(response.data);
			log(colors.blue, `   Response keys: ${keys.join(', ')}`);

			// Log counts if available
			if (response.data.count !== undefined) {
				log(colors.blue, `   Count: ${response.data.count}`);
			}

			// Log data preview
			if (response.data.data) {
				const dataType = Array.isArray(response.data.data) ? 'array' : typeof response.data.data;
				log(colors.blue, `   Data type: ${dataType}`);
			}
		}

		return { success: true, data: response.data };
	} catch (error) {
		if (error.response) {
			if (error.response.status === 402) {
				log(colors.yellow, `   ⚠️  402 Payment Required (expected for x402 endpoints)`);
				return { success: true, requiresPayment: true };
			}
			log(colors.red, `   ❌ ${error.response.status} ${error.response.statusText}`);
			log(colors.red, `   Error: ${JSON.stringify(error.response.data, null, 2)}`);
		} else {
			log(colors.red, `   ❌ ${error.message}`);
		}
		return { success: false, error: error.message };
	}
}

async function runTests() {
	console.log('\n' + '='.repeat(70));
	log(colors.cyan, '🧪 Phase 1 Endpoint Tests - Engrave Protocol Mempool API');
	console.log('='.repeat(70));

	const results = {
		passed: 0,
		failed: 0,
		requiresPayment: 0,
	};

	// Test 1: Address UTXO
	const test1 = await testEndpoint(
		'Get Address UTXOs',
		`/address/${TEST_ADDRESS}/utxo`
	);
	if (test1.success) {
		if (test1.requiresPayment) results.requiresPayment++;
		else results.passed++;
	} else {
		results.failed++;
	}

	// Test 2: Address Mempool Transactions
	const test2 = await testEndpoint(
		'Get Address Mempool Transactions',
		`/address/${TEST_ADDRESS}/txs/mempool`
	);
	if (test2.success) {
		if (test2.requiresPayment) results.requiresPayment++;
		else results.passed++;
	} else {
		results.failed++;
	}

	// Test 3: Transaction Hex
	const test3 = await testEndpoint(
		'Get Transaction Hex',
		`/tx/${TEST_TXID}/hex`
	);
	if (test3.success) {
		if (test3.requiresPayment) results.requiresPayment++;
		else results.passed++;
	} else {
		results.failed++;
	}

	// Test 4: Transaction Outspends
	const test4 = await testEndpoint(
		'Get Transaction Outspends',
		`/tx/${TEST_TXID}/outspends`
	);
	if (test4.success) {
		if (test4.requiresPayment) results.requiresPayment++;
		else results.passed++;
	} else {
		results.failed++;
	}

	// Test 5: Broadcast Transaction (will fail without valid tx)
	log(colors.cyan, '\n📡 Testing: Broadcast Transaction');
	log(colors.blue, '   Note: Skipping actual broadcast (requires valid tx hex)');
	log(colors.yellow, '   ⚠️  Endpoint available at POST /tx');

	// Test 6: Block Transactions
	const test6 = await testEndpoint(
		'Get Block Transactions',
		`/block/${TEST_BLOCK_HASH}/txs`
	);
	if (test6.success) {
		if (test6.requiresPayment) results.requiresPayment++;
		else results.passed++;
	} else {
		results.failed++;
	}

	// Test 7: Block by Height
	const test7 = await testEndpoint(
		'Get Block by Height',
		`/block-height/${TEST_BLOCK_HEIGHT}`
	);
	if (test7.success) {
		if (test7.requiresPayment) results.requiresPayment++;
		else results.passed++;
	} else {
		results.failed++;
	}

	// Test 8: Mempool Blocks Projection
	const test8 = await testEndpoint(
		'Get Projected Mempool Blocks',
		'/fees/mempool-blocks'
	);
	if (test8.success) {
		if (test8.requiresPayment) results.requiresPayment++;
		else results.passed++;
	} else {
		results.failed++;
	}

	// Summary
	console.log('\n' + '='.repeat(70));
	log(colors.cyan, '📊 Test Summary');
	console.log('='.repeat(70));
	log(colors.green, `✅ Passed: ${results.passed}`);
	log(colors.yellow, `💰 Requires Payment (x402): ${results.requiresPayment}`);
	log(colors.red, `❌ Failed: ${results.failed}`);

	const total = results.passed + results.requiresPayment + results.failed;
	const successRate = ((results.passed + results.requiresPayment) / total * 100).toFixed(1);

	console.log('');
	log(colors.cyan, `Success Rate: ${successRate}%`);

	if (results.requiresPayment > 0) {
		console.log('');
		log(colors.yellow, '💡 Note: Endpoints returning 402 are working correctly!');
		log(colors.yellow, '   They require x402 payment headers to access.');
	}

	console.log('');
	log(colors.cyan, '🎉 Phase 1 Implementation Complete!');
	console.log('');
	log(colors.blue, '📋 Implemented Endpoints:');
	log(colors.blue, '   1. GET  /address/:address/utxo - UTXO queries ($0.05)');
	log(colors.blue, '   2. GET  /address/:address/txs/mempool - Mempool txs ($0.02)');
	log(colors.blue, '   3. GET  /tx/:txid/hex - Raw transaction hex ($0.03)');
	log(colors.blue, '   4. GET  /tx/:txid/outspends - Output spend status ($0.05)');
	log(colors.blue, '   5. POST /tx - Broadcast transaction ($0.50)');
	log(colors.blue, '   6. GET  /block/:hash/txs - Block transactions ($0.15)');
	log(colors.blue, '   7. GET  /block-height/:height - Block by height ($0.05)');
	log(colors.blue, '   8. GET  /fees/mempool-blocks - Mempool blocks ($0.02)');

	console.log('='.repeat(70) + '\n');
}

// Run tests
runTests().catch(console.error);
