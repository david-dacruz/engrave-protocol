---
marp: true
theme: default
paginate: true
backgroundColor: #0a0a0a
color: #e8e8e8
style: |
  section {
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 0.9em;
  }
  h1 {
    color: #00d4ff;
    text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
    font-size: 2em;
  }
  h2 {
    color: #00ffa3;
    font-size: 1.5em;
  }
  h3 {
    font-size: 1.2em;
    color: #b8b8b8;
  }
  p, li {
    font-size: 0.95em;
    line-height: 1.5;
  }
  code {
    background: #2a2a2a;
    color: #e8e8e8;
    border: 1px solid #444;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.85em;
  }
  pre {
    background: #1e1e1e !important;
    border: 1px solid #444;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    font-size: 0.75em;
    padding: 12px;
  }
  pre code {
    background: transparent;
    border: none;
    color: #d4d4d4;
    font-size: 1em;
  }
  .lead {
    text-align: center;
    font-size: 1.3em;
  }
  strong {
    color: #00ffa3;
  }
  table {
    font-size: 0.8em;
  }
  blockquote {
    border-left: 4px solid #00d4ff;
    padding-left: 1em;
    color: #b8b8b8;
    font-style: italic;
    font-size: 0.9em;
  }
---

<!-- _class: lead -->

# 🪶 Engrave Protocol

**AI Agents Meet Bitcoin Data**
*Micropayments on Solana, Zero Subscriptions*

Built for Solana x402 Hackathon

---

## What is Engrave Protocol?

**Pay-per-use Bitcoin data for AI agents**

Instead of monthly subscriptions, AI agents pay tiny amounts (as low as $0.01) for each API call they make.

### Why this matters

- 🤖 **AI agents** can access Bitcoin blockchain data when they need it
- 💰 **Developers** only pay for what they use (no $99/month subscriptions)
- ⚡ **Instant payments** via Solana (sub-second confirmations)
- 🔒 **No API keys** to manage - payment IS authentication

---

## The Problem

### How APIs work today

**Monthly Subscription Model**
- Pay $99/month regardless of usage
- Manage API keys (security risk)
- Hit rate limits anyway
- Wasted money if you don't use it

**For AI agents, this is broken:**
- Agents need data on-demand, not 24/7
- Hard to predict usage patterns
- Multiple agents = multiple subscriptions
- Small projects can't afford $99/month

---

## The Solution: Micropayments

```
AI Agent asks Claude: "What are current Bitcoin fees?"
                 ↓
Claude calls Engrave Protocol MCP tool
                 ↓
Pays $0.01 USDC on Solana (instant)
                 ↓
Gets current fee data from mempool
                 ↓
Claude answers: "3 sat/vB for 1-hour confirmation"
```

**True pay-as-you-go:** Only pay for queries you actually make

---

## Live Demo: Real AI Interaction

### Scenario: Trader wants to send Bitcoin transaction

User asks AI agent:
> "I want to send a Bitcoin transaction. What fee should I use for 1-hour confirmation?"

Let's see what happens behind the scenes...

---

## Demo: Step 1 - Free Connectivity Check

AI agent first checks if the mempool API is available:

```bash
GET /api/v1/mempool/height
```

**Response:**
```json
{
  "success": true,
  "height": 4761908,
  "network": "testnet"
}
```

✅ **FREE endpoint** - No payment needed for basic connectivity

---

## Demo: Step 2 - Fee Query (Requires Payment)

AI agent needs fee recommendations:

```bash
GET /api/v1/mempool/fees
```

**Response: 402 Payment Required**
```json
{
  "x402Version": 1,
  "accepts": [{
    "network": "solana-devnet",
    "maxAmountRequired": "10000",
    "payTo": "B4GpAU...G3a",
    "asset": "4zMMC9...ncDU"
  }]
}
```

💰 API says: **"Pay me 10,000 base units (0.01 USDC) on Solana"**

---

## Demo: Step 3 - Agent Makes Payment

MCP server automatically:
1. Creates Solana transaction (0.01 USDC)
2. Signs with wallet
3. Confirms on devnet (~400ms)
4. Retries request with payment proof

**All of this happens automatically** - user doesn't see it!

---

## Demo: Step 4 - Get Data & Answer

**Response: 200 OK**
```json
{
  "success": true,
  "fees": {
    "fastestFee": 5,
    "halfHourFee": 4,
    "hourFee": 3,
    "economyFee": 2
  },
  "unit": "sat/vB",
  "network": "testnet"
}
```

AI responds to user:
> "For 1-hour confirmation, use **3 sat/vB**. Current fees are low."

**Total time:** ~950ms  |  **Total cost:** $0.01

---

## Real Use Case: Trading Bot

**Scenario:** Monitor mempool congestion to time transactions

```
Trading bot checks every 30 seconds:
- Mempool stats ($0.01)
- Fee rates ($0.01)
- Transaction status ($0.05)

Total: ~$0.17 per check = $490/day if running 24/7
```

**But here's the magic:**
- Bot only runs when market is volatile
- Maybe 2 hours per day = **$40/day**
- Traditional API: **$300/month** (whether you use it or not)

**Savings: 75%** for active days, **99%** for quiet days

---

## Real Use Case: Blockchain Explorer

**Scenario:** User looks up their transaction

Traditional model:
- Explorer pays $300/month for API access
- Serves 10,000 user queries per month
- Cost per query: $0.03 + infrastructure

Engrave Protocol model:
- Explorer pays **$0.10 per user query**
- Charges user **$0.12** (20% markup)
- **Zero fixed costs**, instant profit

Perfect for new blockchain explorers that can't afford upfront costs!

---

## Real Use Case: Research & Analysis

**Scenario:** Academic studying Bitcoin transaction patterns

```
Researcher needs data sporadically:
- Heavy usage during analysis: $50/week
- Breaks between studies: $0/week
- Traditional API: $99/month ALWAYS

Annual cost:
- Engrave Protocol: ~$600 (12 active weeks)
- Traditional API: $1,188 (always on)

Saves: $588/year + no commitment
```

---

## How It Works (High-Level)

```
┌─────────────────────────┐
│  User asks AI Agent     │
│  "What are BTC fees?"   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  MCP Server             │
│  (Engrave Protocol)     │
│  Pays $0.01 USDC        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Express API            │
│  Verifies payment       │
│  Fetches mempool data   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Returns fee data       │
│  to AI Agent            │
└─────────────────────────┘
```

**Technology:** MCP (Model Context Protocol) + x402 (Payment Protocol) + Solana

---

## Available Data (8 Endpoints)

| What You Get | Cost | Example Use |
|-------------|------|-------------|
| Block height | **FREE** | Connectivity check |
| Fee rates | $0.01 | Transaction planning |
| Mempool stats | $0.01 | Congestion monitoring |
| TX status | $0.05 | Confirmation tracking |
| TX details | $0.10 | Investigation |
| Address info | $0.10 | Balance check |
| Address history | $0.25 | Full audit |
| Block data | $0.10 | Chain analysis |

**All prices in USDC on Solana Devnet**

---

## Why Solana?

We chose Solana for payments because:

1. **Fast** - Transactions confirm in ~400ms
2. **Cheap** - Transaction fees ~$0.0001
3. **Scalable** - Thousands of TPS, perfect for micropayments
4. **USDC native** - Stablecoin for predictable pricing

**User experience:** API calls feel instant even with blockchain payment!

---

## Cost Comparison

### Traditional API (mempool.space equivalent)
```
$99/month subscription
= $1,188/year
= $0.27 per day (if you use it once)
= $3.30 per query (if you make 30/month)
```

### Engrave Protocol
```
$0.01 - $0.25 per query
= Pay only when you use it
= $0 if you don't use it
= Perfect for sporadic usage
```

**Break-even:** 396 queries per month

---

## What We Built

✅ **MCP Server**
- 8 production-ready tools for AI agents
- Automatic Solana payment handling
- Wallet management

✅ **Payment Gateway API**
- x402 protocol implementation
- Rate limiting & error handling
- Async payment settlement

✅ **Bitcoin Data Bridge**
- mempool.space API integration
- Testnet support (mainnet ready)

✅ **Complete Integration**
- Works with Claude Code, Claude Desktop
- Ready for Gemini and other AI platforms

---

## Live Right Now

**You can try it today:**

```bash
# Install
git clone https://github.com/david-dacruz/engrave-protocol
cd engrave-protocol/api
npm install

# Start API server
npm run dev

# Test free endpoint
curl http://localhost:3000/api/v1/mempool/height

# Test paid endpoint (requires MCP setup)
claude "What are current Bitcoin testnet fees?"
```

**Status:** Production-ready on Solana Devnet & Bitcoin Testnet

---

## Next Steps

**Phase 1:** Launch on Mainnet (Q1 2025)
- Real USDC payments
- Bitcoin mainnet data
- Public API access

**Phase 2:** More Data Sources (Q2 2025)
- Ethereum support
- More blockchain APIs
- Custom data queries

**Phase 3:** Enterprise Features (Q3 2025)
- Volume discounts
- White-label API
- SLA guarantees

---

## Why This Matters

**For AI Agents:**
- No more expensive subscriptions
- Access data on-demand
- True pay-as-you-go

**For Developers:**
- Build blockchain tools without upfront costs
- Perfect for MVPs and prototypes
- Scale costs with usage

**For the Ecosystem:**
- Democratizes access to blockchain data
- Enables new business models
- Micropayments become practical

---

## Technical Highlights

**For the technically curious:**

- x402 payment protocol (HTTP 402 Payment Required)
- MCP (Model Context Protocol) for AI integration
- Solana SPL tokens (USDC with 6 decimals)
- Decimal.js for financial precision
- Rate limiting with Bottleneck
- Async payment settlement
- OpenAPI 3.1 documentation

**Code:** Open source on GitHub (coming soon)

---

<!-- _class: lead -->

# Q&A

**Questions?**

---

## Get Started

### 🔗 Links
- **GitHub:** github.com/david-dacruz/engrave-protocol
- **API Docs:** localhost:3000/api-docs
- **Demo folder:** Real interaction examples

### 📧 Contact
- **Email:** contact@engrave-protocol.com
- **Twitter:** @EngraveProtocol

### 💡 Built for Solana x402 Hackathon
**Powered by:** Solana, Bitcoin, MCP, x402
**Status:** Production-ready on testnet ✅

---

<!-- _class: lead -->

# Thank You!

**Let's make API access affordable for AI agents**

🪶 **Engrave Protocol**
*Pay for what you use, nothing more*
