# 🧪 Engrave Protocol - Manual Testing Checklist

Complete testing guide for validating the MCP → HTTP → x402 integration.

**Status**: Ready for manual testing
**Last Updated**: 2025-11-10
**Automated Tests**: ✅ All passed

---

## 📋 Automated Test Results

### ✅ Phase 1: Automated Tests (COMPLETED)

| Test | Status | Notes |
|------|--------|-------|
| **Syntax Validation** | ✅ PASS | All 4 new modules have valid syntax |
| **Dependencies Installed** | ✅ PASS | x402-axios, @solana/web3.js, axios, tweetnacl |
| **Wallet Utilities** | ✅ PASS | Successfully created test wallet |
| **Module Imports** | ✅ PASS | wallet-utils, errors modules load correctly |
| **Configuration Files** | ✅ PASS | Both JSON configs are valid |
| **Documentation** | ✅ PASS | 4 guides created (45KB total) |
| **npm Scripts** | ✅ PASS | 4 new MCP scripts added |

**Automated Test Summary**: All core components validated ✅

---

## 🚀 Phase 2: Manual Testing Steps

### Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js 18+ installed (`node -v`)
- [ ] All dependencies installed (`npm install` completed)
- [ ] Two terminal windows available
- [ ] Claude Desktop installed (or MCP Inspector)
- [ ] Internet connection for Solana devnet

---

## Step 1: Environment Setup (5 minutes)

### 1.1 Create .env File

```bash
cd $(pwd)/api

# Copy example to .env
cp .env.example .env
```

### 1.2 Edit .env File

Open `.env` and configure:

```bash
# Required: Add your treasury wallet address
TREASURY_WALLET_ADDRESS=<PASTE_YOUR_ADDRESS_HERE>

# These should be set already:
BASE_API_URL=http://localhost:3000
PORT=3000
X402_NETWORK=solana-devnet
BITCOIN_NETWORK=testnet
```

**How to get TREASURY_WALLET_ADDRESS**:
```bash
cd ../app
node create_wallet.js
# Copy the address that's printed
```

**Checkpoint**:
- [ ] `.env` file exists
- [ ] `TREASURY_WALLET_ADDRESS` is set
- [ ] All other variables have defaults

---

## Step 2: Create MCP Server Wallet (3 minutes)

### 2.1 Generate Wallet

```bash
cd $(pwd)/api
npm run mcp:create-wallet
```

**Expected Output**:
```
[MCP Wallet] ✅ Created new wallet
[MCP Wallet] Address: ABC123...XYZ
[MCP Wallet] Saved to: ./mcp_wallet.json
[MCP Wallet] ⚠️  IMPORTANT: Fund this wallet with USDC on Devnet
[MCP Wallet] 💰 Faucet: https://faucet.circle.com
```

### 2.2 Save Wallet Address

**Copy the wallet address** - you'll need it for funding.

**Checkpoint**:
- [ ] `mcp_wallet.json` file exists
- [ ] Wallet address saved/copied

---

## Step 3: Fund Wallets with USDC (5 minutes)

### 3.1 Fund Treasury Wallet

1. Visit: https://faucet.circle.com
2. Select: **Solana Devnet**
3. Paste: Your **TREASURY_WALLET_ADDRESS**
4. Click: **Request USDC**
5. Wait: ~30 seconds for confirmation

### 3.2 Fund MCP Wallet

1. Visit: https://faucet.circle.com (again)
2. Select: **Solana Devnet**
3. Paste: Your **MCP wallet address** (from Step 2.2)
4. Click: **Request USDC**
5. Wait: ~30 seconds for confirmation

### 3.3 Verify Balances (Optional)

```bash
# Check treasury wallet
open "https://explorer.solana.com/address/<TREASURY_ADDRESS>?cluster=devnet"

# Check MCP wallet
open "https://explorer.solana.com/address/<MCP_ADDRESS>?cluster=devnet"
```

**Expected**: Both wallets should show USDC balance (usually 10 USDC)

**Checkpoint**:
- [ ] Treasury wallet funded (10 USDC)
- [ ] MCP wallet funded (10 USDC)
- [ ] Confirmed on Solana Explorer

---

## Step 4: Start API Server (2 minutes)

### 4.1 Terminal 1: Start API

```bash
cd $(pwd)/api
npm run dev
```

**Expected Output**:
```
🪶 Engrave Protocol - MCP Server
========================================
Environment: development
Port: 3000
Treasury: ABC123...XYZ
Bitcoin Network: testnet
x402 Network: solana-devnet

Server running on http://localhost:3000
```

**Look for**:
- ✅ "Server running on http://localhost:3000"
- ✅ No errors in startup
- ✅ Treasury wallet address displayed

### 4.2 Terminal 2: Test Health Endpoint

```bash
curl http://localhost:3000/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "Engrave Protocol MCP Server",
  "timestamp": "2025-11-10T..."
}
```

**Checkpoint**:
- [ ] API server running without errors
- [ ] Health endpoint returns 200 OK
- [ ] Terminal shows all configuration loaded

---

## Step 5: Test MCP Server Standalone (3 minutes)

### 5.1 Terminal 2: Test MCP Server

```bash
cd $(pwd)/api

# Set environment variables for test
export TREASURY_WALLET_ADDRESS="<YOUR_TREASURY_ADDRESS>"
export BASE_API_URL="http://localhost:3000"
export MCP_WALLET_FILE="./mcp_wallet.json"
export X402_NETWORK="solana-devnet"

# Start MCP server (will print startup logs then wait for stdio)
npm run mcp:start
```

**Expected Output**:
```
[MCP Wallet] Loaded from file: ./mcp_wallet.json
[MCP Wallet] Address: ABC123...XYZ
[MCP Server] 💳 Wallet initialized: ABC123...XYZ
[HTTP Client] Created payment-enabled client
[HTTP Client] Base URL: http://localhost:3000
[HTTP Client] Wallet: ABC123...XYZ
[HTTP Client] Network: solana-devnet
[MCP Server] 🔗 HTTP client ready for x402 payments
🪶 Engrave Protocol MCP Server started
Available tools:
  - inscribe_ordinal: Create Bitcoin Ordinals inscriptions (x402 paid)
  - get_inscription_status: Check inscription status
  - list_inscriptions: List inscriptions by address
  - generate_bitcoin_address: Generate new Bitcoin address
  - validate_bitcoin_address: Validate Bitcoin address
```

**Look for**:
- ✅ "Wallet initialized" with your MCP wallet address
- ✅ "HTTP client ready for x402 payments"
- ✅ All 5 tools listed
- ✅ No errors

**Stop the server**: Press `Ctrl+C`

**Checkpoint**:
- [ ] MCP server starts successfully
- [ ] Wallet loaded correctly
- [ ] HTTP client initialized
- [ ] All 5 tools available

---

## Step 6: Test with MCP Inspector (Optional but Recommended, 5 minutes)

### 6.1 Start MCP Inspector

```bash
cd $(pwd)/api

# Set environment variables
export TREASURY_WALLET_ADDRESS="<YOUR_TREASURY_ADDRESS>"
export BASE_API_URL="http://localhost:3000"
export MCP_WALLET_FILE="./mcp_wallet.json"
export X402_NETWORK="solana-devnet"

# Start inspector (opens in browser)
npm run mcp:inspect
```

**Expected**: Browser opens with MCP Inspector UI

### 6.2 Test Tools in Inspector

#### Test 1: Generate Bitcoin Address (Free Tool)

In the Inspector UI:
1. Select tool: `generate_bitcoin_address`
2. Leave arguments empty or set `{"index": 0}`
3. Click: **Call Tool**

**Expected Response**:
```json
{
  "address": "tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "publicKey": "02a1b2...",
  "index": 0,
  "network": "testnet"
}
```

#### Test 2: Validate Bitcoin Address (Free Tool)

1. Select tool: `validate_bitcoin_address`
2. Arguments: `{"address": "tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"}`
3. Click: **Call Tool**

**Expected Response**:
```json
{
  "address": "tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "valid": true,
  "network": "testnet",
  "message": "Valid Bitcoin address for testnet"
}
```

#### Test 3: Create Inscription (PAID - $1.00 USDC)

1. Select tool: `inscribe_ordinal`
2. Arguments:
```json
{
  "content": "Test inscription from MCP Inspector",
  "content_type": "text/plain"
}
```
3. Click: **Call Tool**

**Watch Terminal 1 (API Server) Logs**:
```
[INSCRIBE] paymentHeader present? true
paymentRequirements { ... }
verified true
Processing inscription request...
✅ Inscription created successfully
```

**Expected Response in Inspector**:
```json
{
  "success": true,
  "message": "Bitcoin Ordinals inscription created successfully",
  "inscription": {
    "id": "abc123...",
    "txid": "0x789...",
    "content": "Test inscription from MCP Inspector",
    "contentType": "text/plain"
  },
  "payment": {
    "amount": "$1.00 USDC",
    "network": "solana-devnet",
    "status": "settled"
  }
}
```

**Checkpoint**:
- [ ] Generate address works (free tool)
- [ ] Validate address works (free tool)
- [ ] Inscription creation works (paid tool)
- [ ] Payment verification succeeds
- [ ] API logs show payment settled

---

## Step 7: Configure Claude Desktop (5 minutes)

### 7.1 Locate Config File

**macOS**:
```bash
open ~/Library/Application\ Support/Claude/
# Look for claude_desktop_config.json
```

**Windows**:
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux**:
```
~/.config/Claude/claude_desktop_config.json
```

### 7.2 Edit Configuration

Open `claude_desktop_config.json` and add:

```json
{
  "mcpServers": {
    "engrave-protocol": {
      "command": "node",
      "args": [
        "$(pwd)/api/src/mcp/server.js"
      ],
      "env": {
        "TREASURY_WALLET_ADDRESS": "<YOUR_TREASURY_ADDRESS>",
        "BASE_API_URL": "http://localhost:3000",
        "MCP_WALLET_FILE": "$(pwd)/api/mcp_wallet.json",
        "X402_NETWORK": "solana-devnet",
        "BITCOIN_NETWORK": "testnet",
        "NODE_ENV": "development"
      }
    }
  }
}
```

**IMPORTANT**:
- ✅ Use **absolute paths** (starting with `/Users/...`)
- ✅ Replace `<YOUR_TREASURY_ADDRESS>` with actual address
- ✅ Verify paths are correct for your system

### 7.3 Validate JSON

```bash
# Copy config to test validation
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
```

**Expected**: JSON should parse without errors

**Checkpoint**:
- [ ] Config file edited
- [ ] Absolute paths used
- [ ] Treasury address replaced
- [ ] JSON is valid

---

## Step 8: Test with Claude Desktop (10 minutes)

### 8.1 Restart Claude Desktop

1. **Quit** Claude Desktop completely
2. **Relaunch** Claude Desktop
3. **Start new conversation**

### 8.2 Verify MCP Server Connected

**Look for**: Small tool/plugin icon or indication that MCP servers are connected

### 8.3 Test Free Tools First

**In Claude Desktop, type**:

```
Can you generate a new Bitcoin testnet address for me using the engrave-protocol MCP server?
```

**Expected**: Claude uses `generate_bitcoin_address` tool and returns an address

**Example Response**:
```
I've generated a new Bitcoin testnet address for you:

Address: tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
Network: testnet
Index: 0

This address can be used to receive Bitcoin Ordinals inscriptions on the testnet.
```

### 8.4 Test Paid Inscription Tool

**In Claude Desktop, type**:

```
Create a Bitcoin Ordinals inscription with the text:
"First AI-created inscription via MCP and x402 on Solana!"

Use text/plain as the content type.
```

**What Should Happen**:
1. Claude invokes `inscribe_ordinal` tool
2. MCP server logs payment processing
3. Payment deducted from MCP wallet
4. API server creates inscription
5. Claude responds with inscription details

**Expected Response**:
```
I've successfully created a Bitcoin Ordinals inscription for you!

Inscription Details:
- ID: abc123def456...
- Transaction Hash: 0x789ghi012jkl...
- Content: "First AI-created inscription..."
- Content Type: text/plain
- Payment: $1.00 USDC (processed via x402)
- Status: Pending confirmation on Bitcoin testnet

The inscription has been submitted to the Bitcoin network and payment
has been settled on Solana Devnet.
```

**Check Terminal 1 (API Server)**:
```
[INSCRIBE] paymentHeader present? true
verified true
✅ Inscription created successfully
```

**Checkpoint**:
- [ ] Claude Desktop connects to MCP server
- [ ] Free tools work (address generation)
- [ ] Paid tool works (inscription creation)
- [ ] Payment automatically processed
- [ ] Inscription details returned
- [ ] No errors in terminals

---

## Step 9: Verify Payment on Solana Explorer (3 minutes)

### 9.1 Check MCP Wallet Balance

```bash
open "https://explorer.solana.com/address/<MCP_WALLET_ADDRESS>?cluster=devnet"
```

**Look for**:
- Recent transaction (~$1.00 USDC)
- Balance decreased by ~$1.00

### 9.2 Check Treasury Wallet Balance

```bash
open "https://explorer.solana.com/address/<TREASURY_WALLET_ADDRESS>?cluster=devnet"
```

**Look for**:
- Recent transaction (~$1.00 USDC received)
- Balance increased by ~$1.00

**Checkpoint**:
- [ ] MCP wallet balance decreased
- [ ] Treasury wallet balance increased
- [ ] Transaction visible on Solana Explorer
- [ ] Payment amount is $1.00 USDC

---

## Step 10: Test Error Scenarios (5 minutes)

### 10.1 Test Insufficient Funds

1. Wait until MCP wallet has < $1.00 USDC (or create new unfunded wallet)
2. Try creating inscription in Claude

**Expected Error**:
```
I encountered an error creating the inscription:

Insufficient funds in wallet ABC123...XYZ. Required: $1.00 USDC.
Please fund your wallet at https://faucet.circle.com
```

### 10.2 Test API Server Down

1. Stop API server (Ctrl+C in Terminal 1)
2. Try creating inscription in Claude

**Expected Error**:
```
Failed to connect to API server at http://localhost:3000/api/inscribe.
Please ensure the API server is running.
```

### 10.3 Test Invalid Content

```
Create an inscription with 1MB of random text
```

**Expected**: Should fail with content size error (max 400KB)

**Checkpoint**:
- [ ] Error handling works for insufficient funds
- [ ] Error handling works for network issues
- [ ] Error messages are user-friendly

---

## 🎯 Success Criteria

### Core Functionality
- [x] All automated tests pass
- [ ] API server starts without errors
- [ ] MCP server starts and initializes wallet
- [ ] Free MCP tools work (address generation, validation)
- [ ] Paid MCP tool works (inscription creation)
- [ ] x402 payment automatically processes
- [ ] Payment settles to treasury wallet

### Integration
- [ ] Claude Desktop connects to MCP server
- [ ] Natural language → MCP tool invocation works
- [ ] Payment flow is transparent to user
- [ ] Inscription details returned correctly

### Error Handling
- [ ] Insufficient funds → clear error message
- [ ] API down → clear error message
- [ ] Invalid input → proper validation errors

---

## 📊 Final Validation Checklist

Before considering testing complete:

- [ ] **Automated tests**: All passed ✅
- [ ] **Environment setup**: .env configured
- [ ] **Wallets created**: Treasury + MCP wallets
- [ ] **Wallets funded**: Both have USDC on devnet
- [ ] **API server**: Starts and responds to health check
- [ ] **MCP server**: Initializes with wallet and HTTP client
- [ ] **MCP Inspector**: All 5 tools work (at least 3 tested)
- [ ] **Claude Desktop**: Configuration valid
- [ ] **End-to-end flow**: Inscription created via natural language
- [ ] **Payment flow**: USDC transferred MCP → Treasury
- [ ] **Error handling**: At least 2 error scenarios tested

---

## 🐛 Troubleshooting

### Issue: MCP server won't start

**Check**:
```bash
# Verify wallet file exists
ls -la mcp_wallet.json

# Check environment variables
echo $TREASURY_WALLET_ADDRESS
echo $MCP_WALLET_FILE
```

### Issue: Payment verification failed

**Check**:
1. MCP wallet has USDC balance
2. API server is running and healthy
3. Facilitator URL is correct (https://facilitator.payai.network)
4. Network is `solana-devnet`

### Issue: Claude Desktop doesn't see tools

**Solutions**:
1. Restart Claude Desktop completely
2. Verify config path is absolute (not relative)
3. Check config JSON is valid (`jq` validation)
4. Check MCP server starts in terminal manually

---

## 📝 Test Results

**Date Tested**: _________________
**Tester**: _________________

| Test Step | Result | Notes |
|-----------|--------|-------|
| Step 1: Environment Setup | ☐ Pass ☐ Fail | |
| Step 2: Create MCP Wallet | ☐ Pass ☐ Fail | |
| Step 3: Fund Wallets | ☐ Pass ☐ Fail | |
| Step 4: Start API Server | ☐ Pass ☐ Fail | |
| Step 5: Test MCP Server | ☐ Pass ☐ Fail | |
| Step 6: MCP Inspector | ☐ Pass ☐ Fail | |
| Step 7: Configure Claude | ☐ Pass ☐ Fail | |
| Step 8: Test with Claude | ☐ Pass ☐ Fail | |
| Step 9: Verify Payment | ☐ Pass ☐ Fail | |
| Step 10: Error Scenarios | ☐ Pass ☐ Fail | |

**Overall Result**: ☐ PASS ☐ FAIL

**Issues Found**:
_________________________________________________________________________________

---

## 🚀 Next Steps After Testing

If all tests pass:
- [ ] Create demo video (optional)
- [ ] Take screenshots for documentation
- [ ] Review [HACKATHON_NARRATIVE.md](./docs/HACKATHON_NARRATIVE.md)
- [ ] Prepare hackathon submission

---

*Testing Checklist v1.0 - Engrave Protocol - Solana x402 Hackathon*
