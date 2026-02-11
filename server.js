const express = require('express');
const { ethers } = require('ethers');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Base Mainnet RPC
const BASE_RPC = 'https://mainnet.base.org';
const BASESCAN_API = 'https://api.basescan.org/api';

const provider = new ethers.JsonRpcProvider(BASE_RPC);

// Utility: Get wallet balance
async function getWalletBalance(address) {
  try {
    const checksummed = ethers.getAddress(address);
    const balance = await provider.getBalance(checksummed);
    const ethBalance = ethers.formatEther(balance);
    
    let usdPrice = 'N/A';
    try {
      const priceRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', { timeout: 5000 });
      const ethPrice = priceRes.data.ethereum.usd;
      const usdValue = (parseFloat(ethBalance) * ethPrice).toFixed(2);
      usdPrice = `$${usdValue}`;
    } catch (e) {}
    
    return { ethBalance, usdPrice, address: checksummed };
  } catch (err) {
    throw new Error(`Invalid address: ${err.message}`);
  }
}

// Utility: Get transactions
async function getRecentTransactions(address, limit = 10) {
  try {
    const checksummed = ethers.getAddress(address);
    const response = await axios.get(BASESCAN_API, {
      params: {
        module: 'account',
        action: 'txlist',
        address: checksummed,
        startblock: 0,
        endblock: 99999999,
        sort: 'desc',
        apikey: 'XXXXXXXXXX',
      },
      timeout: 10000,
    });
    
    if (response.data.status !== '1' || !response.data.result) return [];
    
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
    return [];
  }
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Base Wallet Dashboard</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background: #0a0e27; color: #fff; }
        h1 { color: #00d4ff; }
        input { padding: 10px; width: 300px; margin: 10px 0; border: 1px solid #333; background: #1a1f3a; color: #fff; }
        button { padding: 10px 20px; background: #00d4ff; border: none; cursor: pointer; border-radius: 5px; color: #000; font-weight: bold; }
        .result { background: #1a1f3a; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #00d4ff; }
        .error { border-left-color: #ff6b6b; color: #ff6b6b; }
        .success { border-left-color: #51cf66; }
        .tx { background: #0f1426; padding: 15px; margin: 10px 0; border-radius: 5px; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>🏦 Base Wallet Dashboard</h1>
      
      <div>
        <input type="text" id="address" placeholder="Enter wallet address (or leave blank)" value="0x5a6D7e5b296D184e66A1795f2E2AB8E52a640fD8">
        <br>
        <button onclick="getBalance()">📊 Get Balance</button>
        <button onclick="getTransactions()">📝 Get Transactions</button>
      </div>
      
      <div id="result"></div>
      
      <script>
        const defaultAddress = '0x5a6D7e5b296D184e66A1795f2E2AB8E52a640fD8';
        
        async function getBalance() {
          const address = document.getElementById('address').value || defaultAddress;
          const result = document.getElementById('result');
          result.innerHTML = '<p>Loading...</p>';
          
          try {
            const res = await fetch(\`/api/balance?address=\${address}\`);
            const data = await res.json();
            
            if (data.error) {
              result.innerHTML = \`<div class="result error">❌ \${data.error}</div>\`;
            } else {
              result.innerHTML = \`
                <div class="result success">
                  <strong>📊 Balance</strong><br>
                  Address: <code>\${data.address}</code><br>
                  Balance: <strong>\${data.ethBalance} ETH</strong> (\${data.usdPrice})
                </div>
              \`;
            }
          } catch (e) {
            result.innerHTML = \`<div class="result error">Error: \${e.message}</div>\`;
          }
        }
        
        async function getTransactions() {
          const address = document.getElementById('address').value || defaultAddress;
          const result = document.getElementById('result');
          result.innerHTML = '<p>Loading...</p>';
          
          try {
            const res = await fetch(\`/api/transactions?address=\${address}\`);
            const data = await res.json();
            
            if (data.error) {
              result.innerHTML = \`<div class="result error">❌ \${data.error}</div>\`;
            } else if (data.transactions.length === 0) {
              result.innerHTML = \`<div class="result">No transactions found</div>\`;
            } else {
              let html = '<div class="result success"><strong>📝 Recent Transactions</strong>';
              data.transactions.forEach((tx, i) => {
                html += \`
                  <div class="tx">
                    <strong>\${i + 1}. \${tx.hash.slice(0, 10)}...</strong><br>
                    To: \${tx.to.slice(0, 10)}...\${tx.to.slice(-4)}<br>
                    Value: <strong>\${tx.value} ETH</strong> | Gas: \${tx.gasPrice} gwei<br>
                    Time: \${tx.timeStamp}
                  </div>
                \`;
              });
              html += '</div>';
              result.innerHTML = html;
            }
          } catch (e) {
            result.innerHTML = \`<div class="result error">Error: \${e.message}</div>\`;
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.get('/api/balance', async (req, res) => {
  const address = req.query.address || '0x5a6D7e5b296D184e66A1795f2E2AB8E52a640fD8';
  try {
    const data = await getWalletBalance(address);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  const address = req.query.address || '0x5a6D7e5b296D184e66A1795f2E2AB8E52a640fD8';
  try {
    const checksummed = ethers.getAddress(address);
    const transactions = await getRecentTransactions(checksummed, 10);
    res.json({ address: checksummed, transactions });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Base Wallet Dashboard running on port ${PORT}`);
});
