#!/usr/bin/env bash
#
# MCP Server Startup Script
# Checks configuration and starts the Engrave Protocol MCP Server
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🪶 Engrave Protocol MCP Server Startup${NC}"
echo "========================================"
echo ""

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Error: Node.js 18 or higher required${NC}"
    echo -e "Current version: $(node -v)"
    echo -e "Please upgrade Node.js: https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo -e "Creating .env from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env with your configuration${NC}"
        echo ""
    else
        echo -e "${RED}❌ Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check required environment variables
echo -e "${BLUE}Checking configuration...${NC}"

MISSING_VARS=0

if [ -z "$TREASURY_WALLET_ADDRESS" ]; then
    echo -e "${RED}❌ TREASURY_WALLET_ADDRESS not set${NC}"
    MISSING_VARS=1
else
    echo -e "${GREEN}✅ Treasury wallet configured${NC}"
fi

if [ -z "$BASE_API_URL" ]; then
    echo -e "${YELLOW}⚠️  BASE_API_URL not set, using default: http://localhost:3000${NC}"
    export BASE_API_URL="http://localhost:3000"
else
    echo -e "${GREEN}✅ API URL: $BASE_API_URL${NC}"
fi

# Check MCP wallet configuration
if [ -z "$MCP_WALLET_SECRET_KEY" ] && [ -z "$MCP_WALLET_FILE" ]; then
    echo -e "${YELLOW}⚠️  No MCP wallet configured${NC}"
    echo -e "${BLUE}Creating new MCP wallet...${NC}"

    # Create wallet using Node.js
    node -e "import('./src/mcp/wallet-utils.js').then(m => m.createWallet('./mcp_wallet.json'))"

    export MCP_WALLET_FILE="./mcp_wallet.json"
    echo -e "${GREEN}✅ MCP wallet created: mcp_wallet.json${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Fund this wallet with USDC on Devnet${NC}"
    echo -e "${BLUE}💰 Faucet: https://faucet.circle.com${NC}"
    echo ""
elif [ -n "$MCP_WALLET_FILE" ]; then
    if [ -f "$MCP_WALLET_FILE" ]; then
        echo -e "${GREEN}✅ MCP wallet file: $MCP_WALLET_FILE${NC}"
    else
        echo -e "${RED}❌ MCP wallet file not found: $MCP_WALLET_FILE${NC}"
        MISSING_VARS=1
    fi
elif [ -n "$MCP_WALLET_SECRET_KEY" ]; then
    echo -e "${GREEN}✅ MCP wallet configured via secret key${NC}"
fi

if [ $MISSING_VARS -eq 1 ]; then
    echo ""
    echo -e "${RED}❌ Configuration incomplete${NC}"
    echo -e "${YELLOW}Please check your .env file and try again${NC}"
    exit 1
fi

echo ""

# Check if API server is running
echo -e "${BLUE}Checking API server...${NC}"
API_URL="${BASE_API_URL:-http://localhost:3000}/health"

if curl -s "$API_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API server is running${NC}"
else
    echo -e "${YELLOW}⚠️  API server not responding at $API_URL${NC}"
    echo -e "${YELLOW}Please start the API server in another terminal:${NC}"
    echo -e "  ${BLUE}cd api && npm run dev${NC}"
    echo ""
    echo -e "${YELLOW}MCP server will start anyway, but inscriptions will fail${NC}"
    echo ""
fi

# Start MCP server
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Starting MCP Server...${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Available tools:${NC}"
echo -e "  • inscribe_ordinal - Create Bitcoin inscriptions (x402 paid)"
echo -e "  • get_inscription_status - Check inscription status"
echo -e "  • list_inscriptions - List inscriptions by address"
echo -e "  • generate_bitcoin_address - Generate Bitcoin address"
echo -e "  • validate_bitcoin_address - Validate Bitcoin address"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Start the MCP server
exec node src/mcp/server.js
