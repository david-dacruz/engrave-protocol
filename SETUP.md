# 🚀 Quick Setup Guide - Engrave Protocol

## Launch Both API and App Together

### Option 1: Using the Launch Script (Recommended)
```bash
# Make sure you're in the project root directory
./launch.sh
```

The launch script will:
- ✅ Check Node.js version (requires 18+)
- ✅ Install all dependencies for API and app
- ✅ Guide you through environment setup
- ✅ Launch both services simultaneously

### Option 2: Using NPM Scripts
```bash
# Install all dependencies
npm run install:all

# Launch both services in development mode
npm run dev

# Or launch both services in production mode
npm start
```

### Option 3: Manual Launch (for debugging)
```bash
# Terminal 1 - Start API Server
cd api
npm install
npm run dev

# Terminal 2 - Start Client App
cd app
npm install
npm start
```

---

## Environment Setup

### 1. Create API Environment File
Create `api/.env` with required variables:
```bash
# Required
TREASURY_WALLET_ADDRESS=your_solana_wallet_address_here
BASE_API_URL=http://localhost:3000
PORT=3000

# Optional (with defaults)
FACILITATOR_URL=https://facilitator.payai.network
X402_NETWORK=solana-devnet
BITCOIN_NETWORK=testnet
NODE_ENV=development
```

### 2. Generate Solana Wallet
```bash
cd app
node create_wallet.js
```
Copy the generated address to your `.env` file as `TREASURY_WALLET_ADDRESS`.

### 3. Fund Your Wallet
Fund your Solana wallet with USDC on Devnet:
- Visit: https://faucet.circle.com
- Enter your wallet address
- Request USDC tokens

---

## Testing the System

### 1. Health Check
Once both services are running, test the API:
```bash
curl http://localhost:3000/health
```

### 2. Test Client App
The client app will automatically:
- ✅ Load or create a Solana wallet
- ✅ Connect to the API server
- ✅ Make a paid request to `/api/inscribe`
- ✅ Handle x402 payment automatically
- ✅ Display inscription results

### 3. Manual API Testing
Test individual endpoints:
```bash
# Bitcoin network info
curl http://localhost:3000/api/bitcoin/network

# Generate Bitcoin address
curl http://localhost:3000/api/bitcoin/address

# Ordinals statistics
curl http://localhost:3000/api/ordinals/stats
```

---

## Available Services

### API Server (Port 3000)
- **Health Check**: `GET /health`
- **Inscription**: `GET /api/inscribe` (x402 paid - $1.00 USDC)
- **Bitcoin Endpoints**: `GET /api/bitcoin/*`
- **Ordinals Endpoints**: `GET /api/ordinals/*`

### Client App
- Automatically connects to API server
- Handles x402 payments via Solana
- Creates Bitcoin Ordinals inscriptions
- Displays payment and inscription details

---

## Troubleshooting

### Port Already in Use
If port 3000 is busy, change the port in `api/.env`:
```bash
PORT=3001
BASE_API_URL=http://localhost:3001
```

And update the app configuration in `app/index.js`:
```javascript
const baseURL = 'http://localhost:3001';
```

### Missing Dependencies
Run the install script:
```bash
npm run install:all
```

### Wallet Issues
Delete existing wallet files and regenerate:
```bash
rm app/wallet.txt app/solana_wallet.json
cd app && node create_wallet.js
```

### Payment Failures
Ensure your Solana wallet has USDC:
1. Check balance at https://explorer.solana.com (Devnet)
2. Fund via https://faucet.circle.com
3. Wait for confirmation before testing

---

## Quick Test Commands

```bash
# Full system test
npm run test:basic      # Test API functionality
npm run test:endpoints  # Test all endpoints
npm run test:app        # Test client app

# Launch and test
./launch.sh            # Launch both services
# Then in another terminal:
curl http://localhost:3000/health
```

---

## Success Indicators

✅ **API Server Running**: Console shows "Engrave Protocol - MCP Server" banner  
✅ **Client Connected**: App shows "Loaded Solana wallet" message  
✅ **Payment Working**: App processes x402 payment automatically  
✅ **Inscription Created**: API returns inscription ID and transaction hash  

---

*For detailed documentation, see README.md and IMPLEMENTATION_SUMMARY.md*