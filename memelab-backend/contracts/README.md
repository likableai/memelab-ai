# BEP-20 Token for BSC

## Deploy with Hardhat

1. Install dependencies:
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
   ```

2. Create `hardhat.config.js`:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   module.exports = {
     solidity: "0.8.20",
     networks: {
       bsc: {
         url: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org",
         chainId: 56,
         accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
       },
       bscTestnet: {
         url: "https://data-seed-prebsc-1-s1.binance.org:8545",
         chainId: 97,
         accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
       },
     },
   };
   ```

3. Deploy:
   ```bash
   npx hardhat run scripts/deploy.js --network bscTestnet
   ```

4. Set in backend `.env`:
   ```
   TOKEN_CONTRACT_ADDRESS=<deployed_address>
   TREASURY_WALLET_ADDRESS=<your_treasury_wallet>
   TOKEN_DECIMALS=18
   ```

## Supply

- Total supply: 100,000,000 tokens (or your choice)
- Decimals: 18 (or 6 for USDC parity)
- All minted to deployer at construction; no further minting.
