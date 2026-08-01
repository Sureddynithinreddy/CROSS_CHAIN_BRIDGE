# NexusBridge: Educational Ethereum ↔ Solana Cross-Chain Bridge

NexusBridge is a fully functional educational cross-chain bridge demonstrating the lock-and-mint and burn-and-unlock interoperability mechanism between **Ethereum** (ERC-20 tokens) and **Solana** (SPL tokens).

---

## 🏗️ System Architecture

```
                       React Frontend (Vite + TailwindCSS)
                                flex / UI
                    MetaMask                  Phantom
                       │                         │
                       ▼                         ▼
             Ethereum Sepolia / Local      Solana Devnet / Local
                   (ERC-20 Token)            (SPL Token)
                       │                         │
                  Bridge.sol               Anchor Program
                       \                       /
                        \                     /
                       Off-Chain Node.js Relayer
                                  │
                               MongoDB
                                  │
                          Transaction Indexer
```

---

## 📁 Repository Structure

- `ethereum/`: Hardhat workspace with Solidity smart contracts (`MyToken.sol`, `Bridge.sol`), deployment scripts, and unit tests.
- `solana/`: Solana Anchor framework project (`lib.rs`), PDA account state, minting/burning instructions, and TypeScript tests.
- `relayer/`: Off-chain Node.js + TypeScript relayer service subscribing to Ethereum log events and Solana program logs, indexing transactions to MongoDB, and executing cross-chain state updates.
- `frontend/`: Modern React + TypeScript + Vite web interface with glassmorphism UI, dual wallet connection (MetaMask & Phantom), real-time status tracker, and testnet token faucet.
- `shared/`: Common TypeScript interfaces, status enums, and network constants.

---

## 🚀 Quick Start (Local Setup)

### 1. Install & Test Ethereum Contracts
```bash
cd ethereum
npm install
npm run compile
npm test
```

### 2. Build Solana Anchor Program
```bash
cd solana
anchor build
anchor test
```

### 3. Run Backend Relayer & Database
```bash
cd relayer
npm install
npm run dev
```

### 4. Launch Frontend Interface
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Deployment Instructions (Ethereum Sepolia & Solana Devnet)

When you are ready to deploy live to testnets:

### Ethereum Sepolia Deployment
1. Set your testnet private key in `ethereum/.env`:
   ```env
   ETHEREUM_PRIVATE_KEY=your_private_key_hex
   SEPOLIA_RPC_URL=https://rpc.sepolia.org
   ```
2. Run deployment command:
   ```bash
   cd ethereum
   npm run deploy:sepolia
   ```

### Solana Devnet Deployment
1. Configure Solana CLI to Devnet:
   ```bash
   solana config set --url devnet
   solana airdrop 2
   ```
2. Build and deploy Anchor program:
   ```bash
   cd solana
   anchor build
   anchor deploy --provider.cluster devnet
   ```

---

## 🛡️ Security Considerations
- **Replay Protection**: Ethereum withdrawals are gated by `processedWithdrawals[solanaTxHash]` mapping. Solana minting uses `ProcessedEthTx` PDAs derived deterministically from `["processed_eth_tx", eth_tx_hash]`.
- **Relayer Access Control**: Restricted `onlyRelayer` modifier on Ethereum `withdraw()` and `has_one = authority` constraint on Solana Anchor `mint_tokens()`.
