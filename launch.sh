#!/bin/bash

# 🪶 Engrave Protocol - Launch Script
# Launches both API server and client app together

echo "🪶 Engrave Protocol - Launch Script"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Install all dependencies
echo "📦 Installing dependencies..."
echo "Installing root dependencies..."
npm install

echo "Installing API dependencies..."
cd api && npm install
cd ..

echo "Installing app dependencies..."
cd app && npm install
cd ..

echo "✅ All dependencies installed!"
echo ""

# Check for environment configuration
if [ ! -f "api/.env" ]; then
    echo "⚠️  No .env file found in api/ directory"
    echo "📋 Please create api/.env file with required environment variables:"
    echo ""
    echo "Required variables:"
    echo "  TREASURY_WALLET_ADDRESS=your_solana_wallet_address"
    echo "  BASE_API_URL=http://localhost:3000"
    echo "  PORT=3000"
    echo ""
    echo "📄 See api/.env.example for a complete template"
    echo ""
    echo "🔑 To get a Solana wallet address:"
    echo "  1. Run: cd app && node create_wallet.js"
    echo "  2. Copy the generated address to your .env file"
    echo "  3. Fund it with USDC on Devnet: https://faucet.circle.com"
    echo ""
    read -p "Press Enter to continue once you've created the .env file..."
fi

echo "🚀 Starting Engrave Protocol..."
echo ""
echo "📡 API Server will start on: http://localhost:3000"
echo "🖥️  Client App will connect to: http://localhost:3000"
echo ""
echo "Available endpoints:"
echo "  GET  /health - Service health check"
echo "  GET  /api/inscribe - Create inscription (x402 paid)"
echo "  GET  /api/ordinals/* - Ordinals endpoints"
echo "  GET  /api/bitcoin/* - Bitcoin network endpoints"
echo ""
echo "💰 Payment: $1.00 USDC per inscription via x402 protocol"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Launch both services
npm run dev