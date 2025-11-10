# Paid Endpoint Example: Fee Estimation with 402 Payment Required

This example demonstrates the x402 payment flow for accessing paid Bitcoin mempool data.

## Initial Request (No Payment)

```bash
curl -i http://localhost:3000/api/v1/mempool/fees
```

## Response

**Status:** `402 Payment Required`

### Headers

```http
HTTP/1.1 402 Payment Required
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Date: Mon, 10 Nov 2025 14:43:54 GMT
```

### Body

```json
{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana-devnet",
      "maxAmountRequired": "10000",
      "resource": "http://localhost:3000/api/mempool/fees",
      "description": "Bitcoin Fee Estimation",
      "mimeType": "application/json",
      "payTo": "B4GpAUa9vvrDzDDCpovNN53vqck7SkWEGEFz1G127G3a",
      "maxTimeoutSeconds": 300,
      "asset": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      "outputSchema": {},
      "extra": {
        "feePayer": "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4"
      }
    }
  ],
  "error": "Payment required"
}
```

## Payment Requirements Breakdown

| Field | Value | Description |
|-------|-------|-------------|
| **network** | `solana-devnet` | Payment network (Solana testnet) |
| **maxAmountRequired** | `10000` | 0.01 USDC (6 decimals = 10,000 base units) |
| **asset** | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` | USDC token address on Solana devnet |
| **payTo** | `B4GpAUa9vvrDzDDCpovNN53vqck7SkWEGEFz1G127G3a` | Treasury wallet address |
| **description** | `Bitcoin Fee Estimation` | Human-readable purpose |
| **maxTimeoutSeconds** | `300` | Payment proof valid for 5 minutes |

## Next Steps

To access this endpoint, the client must:

1. **Create a Solana transaction** sending 10,000 base units (0.01 USDC) to the treasury wallet
2. **Sign and confirm** the transaction on Solana devnet
3. **Generate payment proof** (x402 signature)
4. **Retry the request** with the `X-Payment` header containing the proof

### Example with x402-axios

```javascript
import { createX402HttpClient } from 'x402-axios';
import { createSolanaSigner } from './http-client.js';

// Create payment client
const httpClient = await createX402HttpClient({
  signer: solanaSigner,
  network: 'solana-devnet'
});

// Make paid request (payment handled automatically)
const response = await httpClient.get('http://localhost:3000/api/v1/mempool/fees');

console.log(response.data);
// {
//   "success": true,
//   "fees": {
//     "fastestFee": 5,
//     "halfHourFee": 4,
//     "hourFee": 3,
//     "economyFee": 2,
//     "minimumFee": 1
//   },
//   "unit": "sat/vB",
//   "network": "testnet"
// }
```

## Cost Analysis

- **Price:** $0.01 USDC per request
- **Solana transaction fee:** ~0.000005 SOL (~$0.0001)
- **Total cost:** ~$0.0101 per query
- **Payment proof validity:** 5 minutes (can reuse for multiple requests)

Compare to traditional API:
- **Monthly subscription:** $99/month (regardless of usage)
- **Break-even point:** 9,900 queries per month
- **Light users save:** 90-99% on costs

## Architecture Flow

```
1. Client: GET /api/v1/mempool/fees
2. API: 402 Payment Required + requirements
3. Client: Create Solana USDC transaction
4. Client: Sign & confirm on devnet
5. Client: GET /api/v1/mempool/fees + X-Payment header
6. API: Verify payment signature
7. API: Fetch data from mempool.space
8. API: Return fee data (200 OK)
9. API: Settle payment in background (async)
```

**Total time:** ~800-1000ms (first request), ~100ms (subsequent requests with cached payment)
