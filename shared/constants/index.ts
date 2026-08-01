export const NETWORKS = {
  ETHEREUM_SEPOLIA: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
    explorer: 'https://sepolia.etherscan.io'
  },
  ETHEREUM_LOCAL: {
    chainId: 31337,
    name: 'Hardhat Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    explorer: ''
  },
  SOLANA_DEVNET: {
    cluster: 'devnet',
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorer: 'https://explorer.solana.com/?cluster=devnet'
  },
  SOLANA_LOCAL: {
    cluster: 'localnet',
    name: 'Solana Localnet',
    rpcUrl: 'http://127.0.0.1:8899',
    explorer: 'https://explorer.solana.com/?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899'
  }
};

export const TOKEN_DECIMALS = {
  ERC20: 18,
  SPL: 9
};

export const BRIDGE_PROGRAM_ID = "Br1dge1111111111111111111111111111111111111";
