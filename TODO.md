# TODO.md - Engrave Protocol Development Roadmap

## 🎯 Project Goal
Complete the **Engrave Protocol MCP Server** that bridges AI Agents on Solana with Bitcoin's settlement layer through x402 micropayments, enabling Bitcoin Ordinals inscriptions via paid API endpoints.

---

## 🚧 Current Status
- ✅ **Core Infrastructure**: Express API server with x402 payment integration
- ✅ **Payment System**: Solana-based micropayments with USDC
- ✅ **Client Integration**: x402-axios client with automatic payment handling
- ✅ **Wallet Management**: Solana wallet creation and management
- ✅ **Bitcoin Integration**: Bitcoin wallet service and Ordinals inscription logic implemented
- ✅ **MCP Compliance**: Full MCP server with Bitcoin Ordinals tools implemented
- ❌ **Production Ready**: Development-only configuration

---

## 📋 TODO List

### Phase 1: Bitcoin Ordinals Integration ✅ COMPLETED

#### 1.1 Bitcoin Wallet Management ✅ COMPLETED
- ✅ **Create Bitcoin wallet service** (`api/src/services/bitcoin.service.js`)
  - ✅ Generate Bitcoin addresses for inscriptions
  - ✅ Manage Bitcoin private keys securely
  - ✅ Handle Bitcoin testnet/mainnet configuration
  - ✅ Implement Bitcoin transaction signing

#### 1.2 Ordinals Inscription Implementation ✅ COMPLETED
- ✅ **Replace placeholder in `agent.service.js`** with real Bitcoin Ordinals logic
  - ✅ Research and integrate Bitcoin Ordinals API/library
  - ✅ Implement inscription creation functionality
  - ✅ Handle inscription content validation (size, format)
  - ✅ Generate inscription transaction
  - ✅ Broadcast to Bitcoin network (mock mode for development)
  - ✅ Return inscription ID and transaction hash

#### 1.3 Bitcoin Network Configuration ✅ COMPLETED
- ✅ **Add Bitcoin configuration to `env.js`**
  - ✅ `BITCOIN_NETWORK` (testnet/mainnet)
  - ✅ `BITCOIN_RPC_URL`
  - ✅ `BITCOIN_WALLET_SEED`
  - ✅ `ORDINALS_API_URL` (if using external service)

### Phase 2: MCP Server Protocol Implementation ✅ COMPLETED

#### 2.1 MCP Server Setup ✅ COMPLETED
- ✅ **Install MCP SDK** (`npm install @modelcontextprotocol/sdk`)
- ✅ **Create MCP server entry point** (`api/src/mcp/server.js`)
  - ✅ Initialize MCP server
  - ✅ Define server capabilities
  - ✅ Handle MCP protocol messages

#### 2.2 MCP Tools Definition ✅ COMPLETED
- ✅ **Define Bitcoin Ordinals tools** in MCP format
  - ✅ `inscribe_ordinal` tool with parameters:
    - `content`: string (inscription content)
    - `content_type`: string (MIME type)
    - `destination_address`: string (Bitcoin address)
  - ✅ `get_inscription_status` tool
  - ✅ `list_inscriptions` tool
  - ✅ `generate_bitcoin_address` tool
  - ✅ `validate_bitcoin_address` tool

#### 2.3 MCP Integration with x402 ✅ COMPLETED
- ✅ **Bridge MCP calls to x402 endpoints**
  - ✅ Convert MCP tool calls to HTTP requests
  - ✅ Handle payment requirements in MCP context
  - ✅ Return MCP-formatted responses

### Phase 3: Enhanced API Endpoints ✅ COMPLETED

#### 3.1 Additional Bitcoin Endpoints ✅ COMPLETED
- ✅ **Create ordinals routes** (`api/src/routes/ordinals.routes.js`)
  - ✅ `GET /api/ordinals/:id` - Get inscription details
  - ✅ `GET /api/ordinals/address/:address` - List inscriptions by address
  - ✅ `POST /api/ordinals/batch` - Batch inscription creation
  - ✅ `GET /api/ordinals/stats` - Get inscription statistics

#### 3.2 Bitcoin Network Endpoints ✅ COMPLETED
- ✅ **Create bitcoin routes** (`api/src/routes/bitcoin.routes.js`)
  - ✅ `GET /api/bitcoin/address` - Generate new Bitcoin address
  - ✅ `GET /api/bitcoin/balance/:address` - Check Bitcoin balance (mock)
  - ✅ `GET /api/bitcoin/tx/:txid` - Get transaction details (mock)
  - ✅ `POST /api/bitcoin/validate` - Validate Bitcoin address
  - ✅ `POST /api/bitcoin/fee-estimate` - Estimate transaction fee
  - ✅ `GET /api/bitcoin/network` - Get network information

### Phase 4: Error Handling & Validation (MEDIUM PRIORITY)

#### 4.1 Enhanced Validation
- [ ] **Improve `validateInscriptionRequest` in `agent.service.js`**
  - [ ] Content size limits (max 400KB for Ordinals)
  - [ ] Content type validation
  - [ ] Bitcoin address validation
  - [ ] Rate limiting per wallet

#### 4.2 Bitcoin-Specific Error Handling
- [ ] **Add Bitcoin error types to `errorHandler.js`**
  - [ ] Bitcoin network errors
  - [ ] Insufficient Bitcoin balance
  - [ ] Invalid inscription content
  - [ ] Transaction broadcast failures

### Phase 5: Testing & Quality Assurance (MEDIUM PRIORITY)

#### 5.1 Unit Tests
- [ ] **Create test suite** (`api/tests/`)
  - [ ] Test x402 payment flow
  - [ ] Test Bitcoin inscription creation
  - [ ] Test MCP server functionality
  - [ ] Test error scenarios

#### 5.2 Integration Tests
- [ ] **End-to-end testing**
  - [ ] Client → API → Bitcoin network flow
  - [ ] Payment verification and settlement
  - [ ] MCP client integration

### Phase 6: Production Readiness (LOW PRIORITY)

#### 6.1 Security Enhancements
- [ ] **Implement rate limiting** (express-rate-limit)
- [ ] **Add request validation middleware**
- [ ] **Secure Bitcoin private key storage**
- [ ] **Add API authentication for admin endpoints**

#### 6.2 Monitoring & Logging
- [ ] **Add structured logging** (winston)
- [ ] **Add health check endpoints**
- [ ] **Add metrics collection**
- [ ] **Add Bitcoin network status monitoring**

#### 6.3 Deployment Configuration
- [ ] **Create Docker configuration**
  - [ ] `Dockerfile` for API server
  - [ ] `docker-compose.yml` for full stack
- [ ] **Add production environment variables**
- [ ] **Create deployment scripts**

### Phase 7: Documentation & Examples (LOW PRIORITY)

#### 7.1 API Documentation
- [ ] **Create OpenAPI/Swagger documentation**
- [ ] **Add endpoint examples and responses**
- [ ] **Document x402 payment flow**

#### 7.2 MCP Documentation
- [ ] **Create MCP client examples**
- [ ] **Document tool schemas**
- [ ] **Add integration guides**

#### 7.3 Developer Experience
- [ ] **Create development setup guide**
- [ ] **Add example client applications**
- [ ] **Create troubleshooting guide**

---

## 🔄 Implementation Order (Step-by-Step Process)

### Week 1: Core Bitcoin Functionality
1. **Day 1-2**: Implement Bitcoin wallet service and configuration
2. **Day 3-4**: Replace agent service placeholder with real Ordinals inscription
3. **Day 5-7**: Test Bitcoin integration on testnet

### Week 2: MCP Server Implementation
1. **Day 1-3**: Set up MCP server infrastructure
2. **Day 4-5**: Define and implement MCP tools
3. **Day 6-7**: Test MCP integration with x402 payments

### Week 3: API Enhancement & Testing
1. **Day 1-3**: Add additional Bitcoin/Ordinals endpoints
2. **Day 4-5**: Implement comprehensive error handling
3. **Day 6-7**: Create and run test suite

### Week 4: Production & Documentation
1. **Day 1-3**: Security enhancements and monitoring
2. **Day 4-5**: Deployment configuration
3. **Day 6-7**: Documentation and examples

---

## 🎯 Success Criteria

- [ ] **Functional Bitcoin Ordinals inscriptions** via paid API calls
- [ ] **Complete MCP server** with defined tools and capabilities
- [ ] **End-to-end payment flow** from Solana client to Bitcoin settlement
- [ ] **Production-ready deployment** with proper security and monitoring
- [ ] **Comprehensive documentation** for developers and users
- [ ] **Hackathon submission** ready for Solana x402 Hackathon (MCP Track)

---

## 🚨 Critical Dependencies

1. **Bitcoin Ordinals Library/API**: Research and select appropriate Bitcoin Ordinals integration
2. **MCP SDK**: Ensure compatibility with latest MCP protocol version
3. **Bitcoin Network Access**: Reliable Bitcoin RPC endpoint or service
4. **Testing Environment**: Bitcoin testnet setup for development

---

## 📊 Estimated Timeline

- **Phase 1 (Bitcoin Integration)**: 1-2 weeks
- **Phase 2 (MCP Implementation)**: 1 week  
- **Phase 3-4 (Enhancement & Testing)**: 1 week
- **Phase 5-7 (Production & Docs)**: 1 week

**Total Estimated Time**: 4-5 weeks for complete implementation

---

*This TODO list will be updated as development progresses and new requirements are identified.*
