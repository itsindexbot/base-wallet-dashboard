#!/usr/bin/env node

const { ethers } = require('ethers');
const chalk = require('chalk');
const axios = require('axios');

// Base Mainnet RPC
const BASE_RPC = 'https://mainnet.base.org';
const BASESCAN_API = 'https://api.basescan.org/api';

// Initialize provider
const provider = new ethers.JsonRpcProvider(BASE_RPC);

// Color formatting
const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,
  bold: chalk.bold,
};

async function getWalletBalance(address) {
  try {
    // Validate address
    const checksummed = ethers.getAddress(address);
    
    // Get balance
    const balance = await provider.getBalance(checksummed);
    const ethBalance = ethers.formatEther(balance);
    
    // Get USD price (Basic ETH pricing)
    let usdPrice = 'N/A';
    try {
      const priceRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', {
        timeout: 5000,
      });
      const ethPrice = priceRes.data.ethereum.usd;
      const usdValue = (parseFloat(ethBalance) * ethPrice).toFixed(2);
      usdPrice = `$${usdValue}`;
    } catch (e) {
      // Silent fail on price fetch
    }
    
    return { ethBalance, usdPrice, address: checksummed };
  } catch (err) {
    throw new Error(`Invalid address or RPC error: ${err.message}`);
  }
}

async function getRecentTransactions(address, limit = 10) {
  try {
    const checksummed = ethers.getAddress(address);
    
    // Fetch from Basescan API
    const response = await axios.get(BASESCAN_API, {
      params: {
        module: 'account',
        action: 'txlist',
        address: checksummed,
        startblock: 0,
        endblock: 99999999,
        sort: 'desc',
        apikey: 'XXXXXXXXXX', // Public endpoint (limited)
      },
      timeout: 10000,
    });
    
    if (response.data.status !== '1' || !response.data.result) {
      return [];
    }
    
    return response.data.result.slice(0, limit).map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther(tx.value),
      gasPrice: ethers.formatUnits(tx.gasPrice, 'gwei'),
      blockNumber: tx.blockNumber,
      timeStamp: new Date(parseInt(tx.timeStamp) * 1000).toLocaleString(),
    }));
  } catch (err) {
    console.warn(colors.warning(`⚠️  Could not fetch transactions: ${err.message}`));
    return [];
  }
}

async function displayBalance(address) {
  console.log(colors.info('\n📊 Base Wallet Balance\n'));
  
  try {
    const { ethBalance, usdPrice, address: checksummed } = await getWalletBalance(address);
    
    console.log(colors.bold('Address:'), checksummed);
    console.log(colors.bold('Balance:'), colors.success(`${ethBalance} ETH`), `(${usdPrice})`);
    console.log();
  } catch (err) {
    console.log(colors.error(`❌ ${err.message}`));
  }
}

async function displayTransactions(address) {
  console.log(colors.info('\n📝 Recent Transactions\n'));
  
  try {
    const txs = await getRecentTransactions(address, 5);
    
    if (txs.length === 0) {
      console.log(colors.warning('No transactions found or API unavailable'));
      return;
    }
    
    txs.forEach((tx, i) => {
      console.log(colors.bold(`${i + 1}. ${tx.hash.slice(0, 10)}...`));
      console.log(`   To: ${tx.to.slice(0, 10)}...${tx.to.slice(-4)}`);
      console.log(`   Value: ${colors.success(tx.value + ' ETH')}`);
      console.log(`   Gas: ${tx.gasPrice} gwei`);
      console.log(`   Time: ${tx.timeStamp}`);
      console.log();
    });
  } catch (err) {
    console.log(colors.error(`❌ ${err.message}`));
  }
}

async function displayTokens(address) {
  console.log(colors.info('\n💎 Token Holdings\n'));
  console.log(colors.warning('Token tracking coming soon! Check back later.'));
  console.log();
}

async function watchAddress(address, interval = 30000) {
  console.log(colors.info('\n👀 Watching Address (CTRL+C to stop)\n'));
  
  let lastBalance = null;
  
  const watch = async () => {
    try {
      const { ethBalance } = await getWalletBalance(address);
      
      if (lastBalance === null) {
        console.log(colors.success(`✅ [${new Date().toLocaleTimeString()}] Balance: ${ethBalance} ETH`));
      } else {
        const change = (parseFloat(ethBalance) - parseFloat(lastBalance)).toFixed(6);
        const icon = change > 0 ? '📈' : change < 0 ? '📉' : '➡️ ';
        console.log(colors.success(`${icon} [${new Date().toLocaleTimeString()}] Balance: ${ethBalance} ETH (${change > 0 ? '+' : ''}${change})`));
      }
      
      lastBalance = ethBalance;
    } catch (err) {
      console.log(colors.error(`❌ Error: ${err.message}`));
    }
  };
  
  await watch();
  setInterval(watch, interval);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  // Default test address (Index's wallet)
  const defaultAddress = '0x5a6D7e5b296D184e66A1795f2E2AB8E52a640fD8';
  const address = args[1] || defaultAddress;
  
  switch (command) {
    case 'balance':
      await displayBalance(address);
      break;
      
    case 'transactions':
      await displayTransactions(address);
      break;
      
    case 'tokens':
      await displayTokens(address);
      break;
      
    case 'watch':
      await watchAddress(address);
      break;
      
    case 'help':
    default:
      console.log(colors.bold('\n🏦 Base Wallet Dashboard\n'));
      console.log('Commands:');
      console.log('  balance [address]       - Show wallet balance');
      console.log('  transactions [address]  - Show recent transactions');
      console.log('  tokens [address]        - Show token holdings (coming soon)');
      console.log('  watch [address]         - Watch address in real-time');
      console.log('  help                    - Show this message\n');
      console.log('Examples:');
      console.log('  npm start balance');
      console.log('  npm start watch 0x1234...');
      console.log('  node index.js transactions 0x5678...\n');
  }
}

main().catch(console.error);
