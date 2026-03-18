# chaincheck

Fast multi-chain RPC health checker & wallet portfolio viewer. Zero dependencies. Node 18+.

## Usage

```bash
# Check all testnet RPCs
node index.js

# Check balances for a wallet
node index.js 0xYourAddress

# Check mainnet RPCs
node index.js --mainnet

# JSON output
node index.js --json
```

## Example Output

```
chaincheck — Testnet RPC Health + Wallet

Chain                  Status    Latency        Block        Balance    Txs
---------------------------------------------------------------------------
Scroll Sepolia         UP          183ms   17,310,680     0.0099 ETH     21
Optimism Sepolia       UP          192ms   41,009,589     0.0098 ETH     54
Monad Testnet          UP          195ms   19,573,035          0 MON      0
Base Sepolia           UP          224ms   39,026,715     0.0100 ETH     38
Ethereum Sepolia       UP          225ms   10,468,845     0.9421 ETH     65
Arbitrum Sepolia       UP          297ms  251,201,785     0.0098 ETH     40
Linea Sepolia          UP          464ms   27,044,944     0.0099 ETH     19

12/12 chains up | avg latency: 313ms
Total: 0.9915 across 12 chains | 237 transactions
```

## Supported Chains

**Testnets** (12): Ethereum Sepolia, Base Sepolia, Optimism Sepolia, Arbitrum Sepolia, Scroll Sepolia, Linea Sepolia, Polygon Amoy, ZKsync Sepolia, Monad, MegaETH, Berachain Bepolia, Fluent

**Mainnets** (8): Ethereum, Base, Optimism, Arbitrum, Polygon, Scroll, Linea, ZKsync Era

## Features

- Zero dependencies — uses native `fetch` (Node 18+)
- Parallel RPC checks — all chains tested simultaneously
- Latency measurement per chain
- Wallet balance + transaction count across all chains
- JSON output mode for scripting
- Mainnet and testnet modes

## License

MIT
