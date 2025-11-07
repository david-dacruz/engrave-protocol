import {
	Connection,
	Keypair,
	Transaction,
	VersionedTransaction,
	clusterApiUrl,
} from '@solana/web3.js';
import axios from 'axios';
import fs from 'fs';
import nacl from 'tweetnacl';
import {decodeXPaymentResponse, withPaymentInterceptor} from 'x402-axios';

// Follow this doc to make paid requests to x402 endpoints:
// https://docs.payai.network/x402/clients/typescript/axios

// -------------------------
// 1) Load or create wallet
// -------------------------
const WALLET_FILE = 'wallet.txt';
let keypair;

if (fs.existsSync(WALLET_FILE)) {
	try {
		const raw = fs.readFileSync(WALLET_FILE, 'utf8').trim();
		const secretKey = Uint8Array.from(JSON.parse(raw));
		keypair = Keypair.fromSecretKey(secretKey);
		console.log('Loaded Solana wallet:', keypair.publicKey.toBase58());
	} catch (e) {
		console.error(
			'Invalid wallet.txt. Delete it and re-run to generate a new wallet.'
		);
		process.exit(1);
	}
} else {
	keypair = Keypair.generate();
	fs.writeFileSync(WALLET_FILE, JSON.stringify(Array.from(keypair.secretKey)));
	console.log('Created new Solana wallet:', keypair.publicKey.toBase58());
	console.log('Fund it with USDC on Devnet via https://faucet.circle.com');
}

// -------------------------
// 2) Connection
// -------------------------
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// -------------------------
// 3) Solana signer for x402
// -------------------------
const solanaSigner = {
	type: 'solana',
	network: 'solana-devnet',

	getAddress: async () => keypair.publicKey.toBase58(),

	sendTransaction: async (txData) => {
		const bytes = Buffer.from(txData.payload, 'base64');
		let sig;
		try {
			const vtx = VersionedTransaction.deserialize(bytes);
			vtx.sign([keypair]);
			sig = await connection.sendTransaction(vtx);
		} catch {
			const ltx = Transaction.from(bytes);
			sig = await connection.sendTransaction(ltx, [keypair]);
		}
		await connection.confirmTransaction(sig, 'confirmed');
		return {hash: sig};
	},

	signMessage: async (message) => {
		const msgBytes =
			typeof message === 'string' ? Buffer.from(message) : message;
		const signature = nacl.sign.detached(msgBytes, keypair.secretKey);
		return Buffer.from(signature).toString('base64');
	},
};

// -------------------------
// 4) Axios + x402 setup
// -------------------------
const baseURL = 'http://localhost:3000';
const endpointPath = '/api/inscribe';
const api = withPaymentInterceptor(
	axios.create({baseURL}),
	solanaSigner,
	(response) => response.data,
	{defaultNetwork: 'solana-devnet'}
);

// -------------------------
// 5) Call paid endpoint
// -------------------------
try {
	console.log('api:', api);
	console.log('endpointPath:', endpointPath);
	const res = await api.get(endpointPath);

	// -------------------------
	// Example output:
	// -------------------------
	// Loaded Solana wallet: 6LVZBNcq3mWQWDPa3VEMwvSDwcLS2EGM62w3Qc9kiV7D
	// api: [Function: wrap] {
	//   constructor: [Function: wrap],
	//   request: [Function: wrap],
	//   _request: [Function: wrap],
	//   getUri: [Function: wrap],
	//   delete: [Function: wrap],
	//   get: [Function: wrap],
	//   head: [Function: wrap],
	//   options: [Function: wrap],
	//   post: [Function: wrap],
	//   postForm: [Function: wrap],
	//   put: [Function: wrap],
	//   putForm: [Function: wrap],
	//   patch: [Function: wrap],
	//   patchForm: [Function: wrap],
	//   defaults: {
	//     transitional: {
	//       silentJSONParsing: true,
	//       forcedJSONParsing: true,
	//       clarifyTimeoutError: false
	//     },
	//     adapter: [ 'xhr', 'http', 'fetch' ],
	//     transformRequest: [ [Function: transformRequest] ],
	//     transformResponse: [ [Function: transformResponse] ],
	//     timeout: 0,
	//     xsrfCookieName: 'XSRF-TOKEN',
	//     xsrfHeaderName: 'X-XSRF-TOKEN',
	//     maxContentLength: -1,
	//     maxBodyLength: -1,
	//     env: { FormData: [Function [FormData]], Blob: [class Blob] },
	//     validateStatus: [Function: validateStatus],
	//     headers: {
	//       common: [Object],
	//       delete: {},
	//       get: {},
	//       head: {},
	//       post: {},
	//       put: {},
	//       patch: {}
	//     },
	//     baseURL: 'http://localhost:5555'
	//   },
	//   interceptors: {
	//     request: InterceptorManager { handlers: [] },
	//     response: InterceptorManager { handlers: [Array] }
	//   },
	//   create: [Function: create]
	// }
	// endpointPath: /api/inscribe
	//
	// Error: Request failed: Cannot read properties of undefined(reading 'scheme')

	console.log('API Response Data:', res.data);

	const xpay = res.headers['x-payment-response'];
	if (xpay) {
		console.log('response', xpay);

		const paymentResponse = decodeXPaymentResponse(xpay);
		console.log('Payment Details:', paymentResponse);
	}
} catch (err) {
	console.error(
		'Request failed:',
		err?.response?.data?.error ?? err?.message ?? String(err)
	);
}
