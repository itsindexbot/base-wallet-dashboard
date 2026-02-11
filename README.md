# 🏦 Base Wallet Dashboard

A lightweight, real-time CLI dashboard for monitoring wallets on **Base** (Coinbase's Layer 2). Check balances, track transactions, and watch addresses live — all from your terminal.

## Features

✅ **Real-time Balance Monitoring** — See ETH balance in real-time with USD conversion  
✅ **Transaction History** — View recent transactions on Base  
✅ **Live Watch Mode** — Stream balance updates every 30s  
✅ **Simple CLI** — No bloat, just what you need  
✅ **Zero Config** — Works out of the box  

## Installation

```bash
git clone https://github.com/itsindexbot/base-wallet-dashboard.git
cd base-wallet-dashboard
npm install
```

## Quick Start

```bash
# Check your balance (default: Index's wallet)
npm start balance

# Watch a specific address in real-time
npm start watch 0x1234567890123456789012345678901234567890

# View recent transactions
npm start transactions

# Show help
npm start help
```

## Commands

### `balance [address]`
Displays ETH balance and USD value.

```bash
npm run balance 0x5a6D7e5b296D184e66A1795f2E2AB8E52a640fD8
```

Output:
```
📊 Base Wallet Balance

Address: 0x5a6D7e5b296D184e66A1795f2E2AB8E52a640fD8
Balance: 0.004724 ETH ($15.42)
```

### `transactions [address]`
Shows the 5 most recent transactions.

```bash
npm run transactions
```

### `watch [address]`
Streams balance updates every 30 seconds (CTRL+C to stop).

```bash
npm run watch 0x1234...
```

## Environment Variables

No config needed! The tool uses public RPC endpoints:
- **Base RPC:** `https://mainnet.base.org`
- **Basescan API:** `https://api.basescan.org/api`

For production, set your own RPC:

```bash
export BASE_RPC=https://your-rpc-provider.com
npm start balance
```

## Architecture

```
index.js              Main CLI entry point
├── getWalletBalance  Fetch ETH balance + USD price
├── getTransactions   Query Basescan for tx history
├── displayBalance    Format & print balance
├── displayWatch      Stream real-time updates
└── main              Command router
```

## Future Features

🔮 **Token Tracking** — ERC-20 holdings  
🔮 **Gas Tracker** — Current Base gas prices  
🔮 **Portfolio Overview** — Net worth summary  
🔮 **Push Alerts** — Notify on large tx  
🔮 **Export Reports** — CSV/JSON export  

## Dependencies

- **ethers.js** — Blockchain interaction  
- **chalk** — Terminal colors  
- **axios** — HTTP requests  

## License

MIT — Use it, fork it, build on it.

---

Built by [@itsindexbot](https://github.com/itsindexbot) for Base builders 🚀
