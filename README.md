# 🪶 Engrave Protocol

**Pay-per-use Bitcoin mempool data for AI Agents via x402 micropayments on Solana**

Built for Solana x402 Hackathon (MCP Track)

---

## 🧩 Overview

**Engrave Protocol** is an **MCP (Model Context Protocol) Server** that gives AI Agents access to Bitcoin blockchain data through **micropayment-protected APIs**.

Instead of expensive monthly subscriptions, AI agents pay tiny amounts (as low as $0.01 USDC) for each query they make. Payments are instant via Solana, and the data comes from Bitcoin's mempool.

**Key Innovation**: No API keys, no subscriptions, no upfront costs. Payment IS authentication.

---

## ❗ Problem Statement

Traditional blockchain data APIs require:

- **$99+/month subscriptions** (regardless of usage)
- **API key management** (security risks)
- **Rate limits** (even if you pay)
- **Wasted money** if you don't use it

For AI Agents with unpredictable, on-demand usage patterns, this model is broken.

---

## ⚙️ Solution

**True pay-as-you-go API access** powered by:

- **x402 HTTP Payment Protocol** - Payment requirements via 402 status code
- **Solana USDC micropayments** - Instant, sub-cent transactions
- **MCP Integration** - Seamless AI agent access via Claude, Gemini, etc.
- **Bitcoin Mempool Data** - Real-time blockchain analytics

```
AI Agent asks: "What are current Bitcoin fees?"
     ↓
Pays $0.01 USDC on Solana (instant)
     ↓
Gets live mempool data
     ↓
AI responds with fee recommendations
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MCP-compatible client (Claude Desktop recommended)
- Solana wallet with USDC on Devnet

### 1. Install & Setup

```bash
# Clone and install
git clone https://github.com/david-dacruz/engrave-protocol.git
cd engrave-protocol/api
npm install

# Configure environment
cp .env.example .env
# Edit .env with your treasury wallet address
```

### 2. Start API Server

```bash
cd api
npm run dev

# API starts on http://localhost:3000
# Test health: curl http://localhost:3000/health
```

### 3. Create MCP Wallet

```bash
# Generate wallet for MCP server (stores in api/mcp_wallet.json)
npm run mcp:create-wallet

# Fund wallet with USDC on Solana Devnet
# Visit: https://faucet.circle.com
```

### 4. Configure Your MCP Client

**For Claude Code CLI**:

```bash
cd engrave-protocol/api
claude mcp add engrave-protocol \
  -e PORT=3000 \
  -e TREASURY_WALLET_ADDRESS=your_solana_treasury_address \
  -- sh -c "cd $(pwd) && node src/mcp/server.js"
```

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
	"mcpServers": {
		"engrave-protocol": {
			"command": "sh",
			"args": [
				"-c",
				"cd /ABSOLUTE/PATH/TO/engrave-protocol/api && node src/mcp/server.js"
			],
			"env": {
				"PORT": "3000",
				"TREASURY_WALLET_ADDRESS": "your_solana_treasury_address"
			}
		}
	}
}
```

### 5. Test It!

Restart Claude Desktop and try:

```
What are the current Bitcoin testnet fee recommendations?
```

The MCP server will automatically:

- Pay $0.01 USDC on Solana
- Query the mempool API
- Return live fee data

---

## 🔧 Available MCP Tools (8 Total)

| Tool                        | Description            | Cost     | Use Case              |
| --------------------------- | ---------------------- | -------- | --------------------- |
| `query_mempool_height`      | Current block height   | **FREE** | Connectivity check    |
| `query_mempool_fees`        | Fee recommendations    | $0.01    | Transaction planning  |
| `query_mempool_stats`       | Mempool statistics     | $0.01    | Congestion monitoring |
| `query_mempool_tx_status`   | TX confirmation status | $0.05    | Track confirmations   |
| `query_mempool_transaction` | Full TX details        | $0.10    | Investigation         |
| `query_mempool_address`     | Address info & balance | $0.10    | Balance check         |
| `query_mempool_address_txs` | Address TX history     | $0.25    | Full audit            |
| `query_mempool_block`       | Block data             | $0.10    | Chain analysis        |

**All prices in USDC on Solana Devnet**

---

## 🏗️ Architecture

```
┌────────────────────────────────────────┐
│  AI Agent (Claude/Gemini)              │
│  "What are Bitcoin fees?"              │
└──────────────┬─────────────────────────┘
               │ MCP Protocol (stdio)
               ▼
┌────────────────────────────────────────┐
│  MCP Server (Engrave Protocol)         │
│  • Manages Solana wallet               │
│  • Handles x402 payments                │
│  • 8 mempool query tools                │
└──────────────┬─────────────────────────┘
               │ HTTP + x402-axios
               ▼
┌────────────────────────────────────────┐
│  Express API (Payment Gateway)         │
│  • Verifies payment signatures          │
│  • Rate limiting (10 req/s)             │
│  • Async payment settlement             │
└──────────────┬─────────────────────────┘
               │ Rate-limited HTTP
               ▼
┌────────────────────────────────────────┐
│  Mempool.space API                     │
│  • Bitcoin blockchain data              │
│  • Testnet & Mainnet support            │
└────────────────────────────────────────┘
```

**Key Innovation**: Payment happens transparently between MCP server and API, user just asks questions.

---

## 💡 Example Use Cases

### 1. Trading Bot

```
Monitor mempool congestion every 30 seconds to time transactions
Cost: $0.03/check = $87/day (if running 24/7)
Traditional API: $300/month (whether you use it or not)
Savings: 70-99% depending on actual usage
```

### 2. Blockchain Explorer

```
User queries their transaction → pay $0.10 → return data
Explorer charges user $0.12 (20% markup)
Zero fixed costs, instant profit margin
```

### 3. Research & Analysis

```
Academic studying Bitcoin patterns sporadically
Heavy analysis: $50/week when active
Quiet periods: $0/week
Traditional API: $99/month ALWAYS
Savings: ~$600/year
```

### 4. AI Assistant

```
User: "Should I send my Bitcoin transaction now?"
Agent: Checks fees ($0.01) + mempool stats ($0.01)
Agent: "Fees are low at 3 sat/vB, good time to send!"
Total cost: $0.02 per question
```

---

## 📊 Cost Comparison

### Traditional API (mempool.space equivalent)

- **Monthly subscription**: $99/month
- **Annual cost**: $1,188/year
- **Cost per query** (30/month): $3.30
- **Wasted if unused**: $99/month

### Engrave Protocol

- **Pay per query**: $0.01 - $0.25
- **Annual cost**: Only what you use
- **Cost per query**: $0.01 - $0.25
- **Wasted if unused**: $0.00

**Break-even point**: ~400 queries/month

---

## 🛠️ Development Scripts

```bash
# API Server
npm run dev              # Start API with hot reload
npm run start            # Start API in production mode

# MCP Server
npm run mcp:create-wallet # Generate new MCP wallet
npm run mcp:inspect      # Test MCP server with inspector

# Testing
curl http://localhost:3000/health                  # Health check
curl http://localhost:3000/api/v1/mempool/height   # Free endpoint
curl http://localhost:3000/api/v1/mempool/fees     # Paid endpoint (returns 402)
```

## 🔐 Security Notes

- ⚠️ **Development Only**: Currently on Bitcoin testnet + Solana devnet
- 💰 **Limited Funds**: Keep minimal USDC in MCP wallet
- 🔒 **Environment Variables**: Use `.env` for sensitive config

---

## 🤝 Contributing

This project is built for the **Solana x402 Hackathon (MCP Track)**.

Contributions welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🔗 Links

- **GitHub**: https://github.com/david-dacruz/engrave-protocol
- **Twitter**: https://x.com/engraveprotocol
- **x402 Protocol**: https://solana.com/developers/guides/getstarted/intro-to-x402
- **MCP Protocol**: https://modelcontextprotocol.io
- **USDC Faucet**: https://faucet.circle.com
- **Mempool.space**: https://mempool.space

---

**Built for the Solana x402 Hackathon** 🏆
_Making blockchain data affordable for AI Agents_

🪶 **Engrave Protocol** - Pay for what you use, nothing more.
