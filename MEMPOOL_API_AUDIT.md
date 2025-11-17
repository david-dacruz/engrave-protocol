# Mempool.space API Coverage Audit

**Date:** 2025-01-17
**Project:** Engrave Protocol - Mempool API Bridge
**Auditor:** Claude Code

## Executive Summary

This audit compares the implemented mempool.space API endpoints in the Engrave Protocol against the complete mempool.space REST API reference. The current implementation covers **8 endpoints** out of approximately **50+ available endpoints**, representing ~16% API coverage.

---

## Current Implementation Status

### ✅ Implemented Endpoints (8 total)

| Endpoint | Route | Cost | Implementation | Status |
|----------|-------|------|----------------|--------|
| **Address Info** | `/address/:address` | $0.10 USDC | `mempoolService.getAddress()` | ✅ Complete |
| **Address Transactions** | `/address/:address/txs` | $0.25 USDC | `mempoolService.getAddressTransactions()` | ✅ Complete |
| **Transaction Details** | `/tx/:txid` | $0.10 USDC | `mempoolService.getTransaction()` | ✅ Complete |
| **Transaction Status** | `/tx/:txid/status` | $0.05 USDC | `mempoolService.getTransactionStatus()` | ✅ Complete |
| **Block Info** | `/block/:hash` | $0.10 USCD | `mempoolService.getBlock()` | ✅ Complete |
| **Fee Estimates** | `/fees` | $0.01 USDC | `mempoolService.getRecommendedFees()` | ✅ Complete |
| **Mempool Stats** | `/stats` | $0.01 USDC | `mempoolService.getMempoolStats()` | ✅ Complete |
| **Block Height** | `/height` | FREE | `mempoolService.getBlockHeight()` | ✅ Complete |

**Files:**
- `api/src/routes/mempool.routes.js` (674 lines)
- `api/src/services/mempool.service.js` (277 lines)

---

## Missing Endpoints by Category

### 🔴 Addresses (6 missing)

| Endpoint | Description | Priority | Complexity |
|----------|-------------|----------|------------|
| `GET /address/:address/utxo` | Get UTXOs for address | HIGH | Low |
| `GET /address/:address/txs/chain/:txid` | Get confirmed tx history from specific tx | MEDIUM | Low |
| `GET /address/:address/txs/mempool` | Get unconfirmed tx for address | HIGH | Low |
| `POST /address/search` | Search multiple addresses | LOW | Medium |
| `GET /address-prefix/:prefix` | Address prefix search | LOW | Low |
| `GET /address/:address/txs/chain` | Get confirmed tx history only | MEDIUM | Low |

**Recommendation:** Implement UTXO and mempool tx endpoints first (HIGH priority).

---

### 🔴 Transactions (8 missing)

| Endpoint | Description | Priority | Complexity |
|----------|-------------|----------|------------|
| `GET /tx/:txid/hex` | Raw transaction hex | HIGH | Low |
| `GET /tx/:txid/merkle-proof` | Merkle inclusion proof | MEDIUM | Low |
| `GET /tx/:txid/merkleblock-proof` | Merkleblock proof | LOW | Low |
| `GET /tx/:txid/outspend/:vout` | Check if output is spent | HIGH | Low |
| `GET /tx/:txid/outspends` | Check all outputs spent status | HIGH | Low |
| `GET /tx/:txid/raw` | Raw transaction binary | MEDIUM | Low |
| `POST /tx` | Broadcast transaction | CRITICAL | Medium |
| `GET /txs/recent` | Recent transactions | LOW | Low |

**Recommendation:** Implement transaction broadcast (`POST /tx`) as CRITICAL for full functionality.

---

### 🔴 Blocks (12 missing)

| Endpoint | Description | Priority | Complexity |
|----------|-------------|----------|------------|
| `GET /block/:hash/header` | Block header only | MEDIUM | Low |
| `GET /block/:hash/raw` | Raw block binary | LOW | Low |
| `GET /block/:hash/status` | Block status | MEDIUM | Low |
| `GET /block/:hash/txs` | Block transactions | HIGH | Low |
| `GET /block/:hash/txs/:index` | Single tx in block | LOW | Low |
| `GET /block/:hash/txids` | All transaction IDs | MEDIUM | Low |
| `GET /block-height/:height` | Block by height | HIGH | Low |
| `GET /blocks` | Recent blocks | LOW | Low |
| `GET /blocks/:startHeight` | Blocks from height | LOW | Low |
| `GET /blocks/tip/hash` | Latest block hash | MEDIUM | Low |
| `GET /blocks/tip/height` | Latest block height | LOW | Low |
| `POST /block/:hash/transactions` | Get multiple txs from block | LOW | Medium |

**Recommendation:** Implement block transactions and block-by-height endpoints (HIGH priority).

---

### 🔴 Mempool (3 missing)

| Endpoint | Description | Priority | Complexity |
|----------|-------------|----------|------------|
| `GET /mempool/recent` | Recent mempool transactions | MEDIUM | Low |
| `GET /mempool/txids` | All mempool transaction IDs | LOW | Low |
| `GET /v1/fees/mempool-blocks` | Projected mempool blocks | HIGH | Low |

**Recommendation:** Implement projected mempool blocks for advanced fee estimation.

---

### 🔴 Mining (8 missing)

| Endpoint | Description | Priority | Complexity |
|----------|-------------|----------|------------|
| `GET /mining/pools` | Mining pools list | MEDIUM | Low |
| `GET /mining/pools/:timeperiod` | Pools by timeperiod | LOW | Low |
| `GET /mining/pool/:slug` | Specific pool info | LOW | Low |
| `GET /mining/pool/:slug/hashrate` | Pool hashrate | LOW | Medium |
| `GET /mining/pool/:slug/blocks` | Blocks mined by pool | LOW | Low |
| `GET /mining/hashrate` | Network hashrate | MEDIUM | Low |
| `GET /mining/difficulty` | Difficulty adjustments | MEDIUM | Low |
| `GET /v1/mining/blocks/fees/:blockHeight` | Block fee details | LOW | Medium |

**Recommendation:** LOW priority unless analytics features are planned.

---

### 🔴 Fee Estimation (2 missing)

| Endpoint | Description | Priority | Complexity |
|----------|-------------|----------|------------|
| `GET /v1/fees/mempool-blocks` | Projected blocks with fees | HIGH | Low |
| `GET /v1/fees/cpfp` | CPFP fee suggestions | MEDIUM | Medium |

**Recommendation:** Implement mempool-blocks for better fee UX.

---

### 🔴 Lightning Network (10+ missing)

| Endpoint Category | Example Endpoints | Priority | Complexity |
|-------------------|-------------------|----------|------------|
| **Channel Stats** | `/lightning/statistics/*` | LOW | High |
| **Node Info** | `/lightning/nodes/*` | LOW | Medium |
| **Channel Data** | `/lightning/channels/*` | LOW | Medium |

**Recommendation:** SKIP unless Lightning integration is a product goal.

---

### 🔴 Websockets (1 connection type)

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Real-time Updates** | `wss://mempool.space/api/v1/ws` | MEDIUM | High |

**Recommendation:** Consider for real-time mempool monitoring features.

---

## Coverage Analysis

### By Category

| Category | Implemented | Available | Coverage | Priority |
|----------|-------------|-----------|----------|----------|
| **Addresses** | 2 | 8 | 25% | HIGH |
| **Transactions** | 2 | 10 | 20% | HIGH |
| **Blocks** | 1 | 13 | 8% | HIGH |
| **Mempool** | 1 | 4 | 25% | MEDIUM |
| **Fees** | 1 | 3 | 33% | MEDIUM |
| **Mining** | 0 | 8 | 0% | LOW |
| **Lightning** | 0 | 10+ | 0% | LOW |
| **Websockets** | 0 | 1 | 0% | MEDIUM |
| **TOTAL** | **8** | **50+** | **~16%** | - |

### By Priority

| Priority | Missing Endpoints | Estimated Effort |
|----------|-------------------|------------------|
| **CRITICAL** | 1 | 4 hours |
| **HIGH** | 9 | 12 hours |
| **MEDIUM** | 12 | 16 hours |
| **LOW** | 18+ | 24+ hours |

---

## Recommendations

### Phase 1: Critical & High Priority (16 hours)

**Goal:** Achieve 40% coverage with essential endpoints

1. **Transaction Broadcasting** (CRITICAL)
   - `POST /tx` - Broadcast transactions
   - Required for full Bitcoin transaction lifecycle

2. **Address Utilities** (HIGH)
   - `GET /address/:address/utxo` - UTXO queries
   - `GET /address/:address/txs/mempool` - Unconfirmed transactions

3. **Transaction Utilities** (HIGH)
   - `GET /tx/:txid/hex` - Raw transaction data
   - `GET /tx/:txid/outspends` - Output spend status

4. **Block Extensions** (HIGH)
   - `GET /block/:hash/txs` - Block transactions
   - `GET /block-height/:height` - Query by height

5. **Fee Improvements** (HIGH)
   - `GET /v1/fees/mempool-blocks` - Projected blocks

### Phase 2: Medium Priority (16 hours)

**Goal:** Achieve 60% coverage with UX-enhancing endpoints

1. Remaining address endpoints (4 endpoints)
2. Remaining transaction endpoints (4 endpoints)
3. Remaining block endpoints (6 endpoints)
4. Mining hashrate/difficulty (2 endpoints)

### Phase 3: Low Priority (24+ hours)

**Goal:** Complete coverage for analytics and advanced features

1. Mining pool analytics
2. Lightning Network endpoints (if needed)
3. Websocket real-time updates
4. Advanced querying endpoints

---

## Implementation Pattern Analysis

### Current Architecture Strengths

1. **Clean Service Layer** - Well-separated concerns (routes vs. service)
2. **Rate Limiting** - Bottleneck library integration
3. **x402 Payment Integration** - Reusable middleware pattern
4. **Error Handling** - Consistent error response format
5. **Generic Route Handler** - `createHandler()` factory reduces boilerplate

### Suggested Improvements

1. **Extend Service Methods** - Add new methods following existing patterns
2. **Route Generation** - Consider route factory for CRUD-like endpoints
3. **Caching Layer** - Add Redis/in-memory cache for frequently accessed data
4. **Batch Endpoints** - Support multiple queries in single request
5. **Pagination** - Add pagination for large result sets (address txs, block txs)

---

## Cost Structure Recommendations

### Suggested Pricing for New Endpoints

| Endpoint Type | Suggested Cost | Rationale |
|---------------|----------------|-----------|
| **POST /tx (broadcast)** | $0.50 USDC | High value, network interaction |
| **UTXO queries** | $0.05 USDC | Medium complexity |
| **Mempool queries** | $0.02 USDC | Low cost, high frequency |
| **Raw data (hex, binary)** | $0.03 USDC | Lightweight queries |
| **Block transactions** | $0.15 USDC | Large response size |
| **Mining stats** | $0.01 USDC | Cacheable data |
| **Websocket connection** | $1.00 USDC/hour | Persistent connection |

---

## Technical Debt & Risks

### Current Issues

1. **No Pagination** - Address transactions endpoint could return 1000s of txs
2. **No Caching** - Repeated queries hit mempool.space API directly
3. **Limited Error Context** - Generic error messages from upstream API
4. **No Request Validation** - Minimal input sanitization
5. **No Rate Limit Headers** - Don't expose rate limit status to clients

### Recommendations

1. Implement response caching (Redis) for block data and fees
2. Add pagination with `?offset=0&limit=25` query params
3. Add request validation using Zod schemas
4. Include rate limit headers in responses (`X-RateLimit-*`)
5. Add request ID tracking for debugging

---

## Comparison with Competitors

### Other Bitcoin API Providers

| Provider | Endpoints | Pricing | Coverage vs Ours |
|----------|-----------|---------|------------------|
| **Blockstream.info** | ~45 endpoints | Free | Similar scope |
| **Blockchain.com** | ~30 endpoints | Free + Paid tiers | More focused |
| **BlockCypher** | ~40 endpoints | Free + Paid tiers | More features |
| **Engrave Protocol** | **8 endpoints** | x402 paid | **16% coverage** |

**Insight:** Current implementation covers core functionality but lags behind competitors in breadth.

---

## Appendix A: Quick Reference

### Current Endpoint Map

```
/api/mempool/
├── address/
│   ├── :address → GET address info ($0.10)
│   └── :address/txs → GET transactions ($0.25)
├── tx/
│   ├── :txid → GET transaction ($0.10)
│   └── :txid/status → GET status ($0.05)
├── block/
│   └── :hash → GET block ($0.10)
├── fees → GET fee estimates ($0.01)
├── stats → GET mempool stats ($0.01)
└── height → GET block height (FREE)
```

### Implementation Files

```
api/src/
├── routes/
│   └── mempool.routes.js      (674 lines, 8 endpoints)
├── services/
│   └── mempool.service.js     (277 lines, 8 methods)
└── config/
    └── pricing.js              (pricing configuration)
```

---

## Appendix B: Data Sources

- **Source Code Analysis:** `api/src/routes/mempool.routes.js`, `api/src/services/mempool.service.js`
- **Test Files:** `api/test-endpoints.js`
- **Mempool.space API:** https://mempool.space/docs/api/rest
- **Industry Knowledge:** Standard Bitcoin API patterns
- **Pricing Reference:** Current x402 implementation

---

## Conclusion

The Engrave Protocol mempool API bridge provides a solid foundation with 8 well-implemented core endpoints. However, with only ~16% coverage of the mempool.space API, there are significant opportunities for expansion:

- **Short-term:** Implement transaction broadcasting and UTXO queries (Phase 1)
- **Medium-term:** Expand to 60% coverage with UX-critical endpoints (Phase 2)
- **Long-term:** Consider analytics features and real-time capabilities (Phase 3)

The current architecture is well-designed for incremental expansion. Following the established patterns in `mempoolService` and the route factory approach will enable rapid implementation of additional endpoints.

**Next Steps:**
1. Review and prioritize Phase 1 endpoints with stakeholders
2. Implement transaction broadcasting as highest priority
3. Add pagination and caching to existing endpoints
4. Begin Phase 1 implementation (~16 hours effort)
