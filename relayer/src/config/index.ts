import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bridge-db',
  
  ethereum: {
    rpcUrl: process.env.ETH_RPC_URL || 'https://rpc.sepolia.org',
    bridgeAddress: process.env.ETH_BRIDGE_ADDRESS || '0x8B391b4EE082472A8182102170fF72Ee6eAcF687',
    tokenAddress: process.env.ETH_TOKEN_ADDRESS || '0x15fF4bC008AF456CE9a8FFC731CbfaAF41dA0b0c',
    relayerPrivateKey: process.env.RELAYER_ETH_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  },
  
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    programId: process.env.SOLANA_PROGRAM_ID || 'Br1dge1111111111111111111111111111111111111',
    relayerKeypairJson: process.env.RELAYER_SOLANA_KEYPAIR_JSON || ''
  }
};
