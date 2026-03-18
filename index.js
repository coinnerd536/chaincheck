#!/usr/bin/env node
/**
 * chaincheck — Fast multi-chain RPC health checker & wallet viewer
 *
 * Usage:
 *   npx chaincheck                    # Check all default testnets
 *   npx chaincheck 0xABC...           # Check balances for a specific wallet
 *   npx chaincheck --mainnet          # Check mainnet RPCs
 *   npx chaincheck --add <name> <rpc> # Add custom chain
 *   npx chaincheck --json             # JSON output
 */

const TESTNETS = [
  { name: 'Ethereum Sepolia', chainId: 11155111, rpc: 'https://ethereum-sepolia-rpc.publicnode.com', explorer: 'https://sepolia.etherscan.io', token: 'ETH' },
  { name: 'Base Sepolia', chainId: 84532, rpc: 'https://sepolia.base.org', explorer: 'https://sepolia.basescan.org', token: 'ETH' },
  { name: 'Optimism Sepolia', chainId: 11155420, rpc: 'https://sepolia.optimism.io', explorer: 'https://sepolia-optimism.etherscan.io', token: 'ETH' },
  { name: 'Arbitrum Sepolia', chainId: 421614, rpc: 'https://sepolia-rollup.arbitrum.io/rpc', explorer: 'https://sepolia.arbiscan.io', token: 'ETH' },
  { name: 'Scroll Sepolia', chainId: 534351, rpc: 'https://sepolia-rpc.scroll.io', explorer: 'https://sepolia.scrollscan.com', token: 'ETH' },
  { name: 'Linea Sepolia', chainId: 59141, rpc: 'https://rpc.sepolia.linea.build', explorer: 'https://sepolia.lineascan.build', token: 'ETH' },
  { name: 'Polygon Amoy', chainId: 80002, rpc: 'https://rpc-amoy.polygon.technology', explorer: 'https://amoy.polygonscan.com', token: 'POL' },
  { name: 'ZKsync Sepolia', chainId: 300, rpc: 'https://sepolia.era.zksync.dev', explorer: 'https://sepolia.explorer.zksync.io', token: 'ETH' },
  { name: 'Monad Testnet', chainId: 10143, rpc: 'https://testnet-rpc.monad.xyz', explorer: 'https://testnet.monadexplorer.com', token: 'MON' },
  { name: 'MegaETH Testnet', chainId: 6343, rpc: 'https://carrot.megaeth.com/rpc', explorer: 'https://megaeth-testnet-v2.blockscout.com', token: 'ETH' },
  { name: 'Berachain Bepolia', chainId: 80069, rpc: 'https://bepolia.rpc.berachain.com', explorer: 'https://bepolia.beratrail.io', token: 'BERA' },
  { name: 'Fluent Testnet', chainId: 20994, rpc: 'https://rpc.testnet.fluent.xyz/', explorer: 'https://testnet.fluentscan.xyz/', token: 'ETH' },
  { name: 'Robinhood Chain', chainId: 46630, rpc: 'https://rpc.testnet.chain.robinhood.com', explorer: 'https://explorer.testnet.chain.robinhood.com', token: 'ETH' },
  { name: 'Lens Sepolia', chainId: 37111, rpc: 'https://rpc.testnet.lens.dev', explorer: 'https://block-explorer.testnet.lens.dev', token: 'GRASS' },
];

const MAINNETS = [
  { name: 'Ethereum', chainId: 1, rpc: 'https://ethereum-rpc.publicnode.com', explorer: 'https://etherscan.io', token: 'ETH' },
  { name: 'Base', chainId: 8453, rpc: 'https://mainnet.base.org', explorer: 'https://basescan.org', token: 'ETH' },
  { name: 'Optimism', chainId: 10, rpc: 'https://mainnet.optimism.io', explorer: 'https://optimistic.etherscan.io', token: 'ETH' },
  { name: 'Arbitrum', chainId: 42161, rpc: 'https://arb1.arbitrum.io/rpc', explorer: 'https://arbiscan.io', token: 'ETH' },
  { name: 'Polygon', chainId: 137, rpc: 'https://polygon-rpc.com', explorer: 'https://polygonscan.com', token: 'POL' },
  { name: 'Scroll', chainId: 534352, rpc: 'https://rpc.scroll.io', explorer: 'https://scrollscan.com', token: 'ETH' },
  { name: 'Linea', chainId: 59144, rpc: 'https://rpc.linea.build', explorer: 'https://lineascan.build', token: 'ETH' },
  { name: 'ZKsync Era', chainId: 324, rpc: 'https://mainnet.era.zksync.io', explorer: 'https://explorer.zksync.io', token: 'ETH' },
];

// Minimal JSON-RPC — zero dependencies
async function rpcCall(url, method, params = [], timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function checkChain(chain, address) {
  const start = Date.now();
  const result = { ...chain, status: 'unknown', latency: 0 };

  try {
    // Check block number (RPC health)
    const blockHex = await rpcCall(chain.rpc, 'eth_blockNumber');
    result.latency = Date.now() - start;
    result.blockNumber = parseInt(blockHex, 16);
    result.status = 'up';

    // Check balance if address provided
    if (address) {
      const balHex = await rpcCall(chain.rpc, 'eth_getBalance', [address, 'latest']);
      result.balance = parseInt(balHex, 16) / 1e18;

      const nonceHex = await rpcCall(chain.rpc, 'eth_getTransactionCount', [address, 'latest']);
      result.nonce = parseInt(nonceHex, 16);
    }
  } catch (err) {
    result.latency = Date.now() - start;
    result.status = 'down';
    result.error = err.name === 'AbortError' ? 'timeout' : err.message?.slice(0, 50);
  }

  return result;
}

function formatBalance(bal) {
  if (bal === undefined) return '';
  if (bal === 0) return '0';
  if (bal < 0.0001) return '<0.0001';
  return bal.toFixed(4);
}

function printTable(results, address) {
  const pad = (s, n) => String(s).padEnd(n);
  const rpad = (s, n) => String(s).padStart(n);

  // Header
  let header = `${pad('Chain', 22)} ${pad('Status', 8)} ${rpad('Latency', 8)} ${rpad('Block', 12)}`;
  if (address) header += ` ${rpad('Balance', 14)} ${rpad('Txs', 6)}`;
  console.log(header);
  console.log('-'.repeat(header.length));

  // Sort: up first, then by latency
  results.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'up' ? -1 : 1;
    return a.latency - b.latency;
  });

  for (const r of results) {
    const status = r.status === 'up' ? 'UP' : 'DOWN';
    const latency = r.latency + 'ms';
    const block = r.blockNumber ? r.blockNumber.toLocaleString() : '-';
    let line = `${pad(r.name, 22)} ${pad(status, 8)} ${rpad(latency, 8)} ${rpad(block, 12)}`;
    if (address) {
      const bal = formatBalance(r.balance) + (r.balance !== undefined ? ' ' + r.token : '');
      line += ` ${rpad(bal, 14)} ${rpad(r.nonce ?? '-', 6)}`;
    }
    console.log(line);
  }

  // Summary
  const up = results.filter(r => r.status === 'up').length;
  const down = results.length - up;
  const avgLatency = Math.round(results.filter(r => r.status === 'up').reduce((a, r) => a + r.latency, 0) / (up || 1));
  console.log(`\n${up}/${results.length} chains up | avg latency: ${avgLatency}ms` + (down > 0 ? ` | ${down} down` : ''));

  if (address) {
    const totalBal = results.reduce((a, r) => a + (r.balance || 0), 0);
    const totalTxs = results.reduce((a, r) => a + (r.nonce || 0), 0);
    console.log(`Total: ${totalBal.toFixed(4)} across ${up} chains | ${totalTxs} transactions`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const mainnet = args.includes('--mainnet');
  const filtered = args.filter(a => !a.startsWith('--'));
  const address = filtered.find(a => /^0x[a-fA-F0-9]{40}$/.test(a));

  const chains = mainnet ? MAINNETS : TESTNETS;

  if (!jsonMode) {
    console.log(`\nchaincheck — ${mainnet ? 'Mainnet' : 'Testnet'} RPC Health${address ? ' + Wallet' : ''}\n`);
  }

  // Check all chains in parallel
  const results = await Promise.all(chains.map(c => checkChain(c, address)));

  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printTable(results, address);
  }
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
