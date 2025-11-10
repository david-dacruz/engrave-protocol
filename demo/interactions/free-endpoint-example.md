# Free Endpoint Example: Block Height Query

This example demonstrates querying the free mempool height endpoint that requires no payment.

## Request

```bash
curl http://localhost:3000/api/v1/mempool/height
```

## Response

**Status:** `200 OK`

```json
{
  "success": true,
  "height": 4761908,
  "network": "testnet"
}
```

## Details

- **Endpoint:** `GET /api/v1/mempool/height`
- **Cost:** FREE (no payment required)
- **Use Case:** Check current Bitcoin testnet block height
- **Response Time:** ~50-100ms
- **Data Source:** mempool.space API

## Why It's Free

This endpoint provides basic blockchain height information that:
- Requires minimal processing
- Has low bandwidth cost
- Useful for connectivity testing
- Helps users verify the API is working
- Common use case for demos and health checks

This free endpoint allows developers to test the integration without needing to set up payments first, while more data-intensive queries require micropayments.
