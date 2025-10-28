/**
 * Etherscan API v2 key
 * Document: https://docs.etherscan.io/introduction
 * V2-migration endpoint: https://docs.etherscan.io/v2-migration
 * IMPORTANT: Set your API key in environment variable: ETHERSCAN_API_KEY
 */
const EtherscanAPIV2Key = process.env.ETHERSCAN_API_KEY || "";
const myWalletAddress = "0x296F5c137b8940776f2E602c6213719bC60f3EF4";

const feeTypeAndTokenSymbolMapPolygon = (type) => {
  let tokenSymbol = "";
  let feeType = 0;
  let tokenContractAddress = "";
  
  const typeStr = String(type);
  
  if (type !== undefined) {
    switch (typeStr) {
      case "1":
        tokenSymbol = "TTJP";
        feeType = 1;
        tokenContractAddress = "0xa4c1168EC5883c5307419B2fC8D0683634d228fd";
        break;
      case "2":
        tokenSymbol = "POL";
        feeType = 0;
        tokenContractAddress = "0x0000000000000000000000000000000000000000";
        break;
      case "3":
        tokenSymbol = "JPYC_PREPAID";
        feeType = 1;
        tokenContractAddress = "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB";
        break;
      case "5":
        tokenSymbol = "USDC";
        feeType = 1;
        tokenContractAddress = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
        break;
      case "11":
        tokenSymbol = "USDT";
        feeType = 1;
        tokenContractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
        break;
      case "13":
        tokenSymbol = "SNPT";
        feeType = 1;
        tokenContractAddress = "0x22737f5Bbb7C5b5BA407b0c1C9a9cdf66CF25D7d";
        break;
      case "15":
        tokenSymbol = "JPYC";
        feeType = 1;
        tokenContractAddress = "0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29";
        break;
      default:
    }
  }
  return { feeType, tokenSymbol, tokenContractAddress };
};

const feeTypeAndTokenSymbolMapEthereum = (type) => {
  let tokenSymbol = "";
  let feeType = 0;
  let tokenContractAddress = "";
  
  const typeStr = String(type);
  
  if (type !== undefined) {
    switch (typeStr) {
      case "10":
        tokenSymbol = "ETH";
        feeType = 0;
        tokenContractAddress = "0x0000000000000000000000000000000000000000";
        break;
      case "1":
        tokenSymbol = "TTJP";
        feeType = 1;
        tokenContractAddress = "0x7388B13D6A029c29463785b993b0BF5E1a48a848";
        break;
      case "15":
        tokenSymbol = "JPYC";
        feeType = 1;
        tokenContractAddress = "0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29";
        break;
      case "3":
        tokenSymbol = "JPYC_PREPAID";
        feeType = 1;
        tokenContractAddress = "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB";
        break;
      case "5":
        tokenSymbol = "USDC";
        feeType = 1;
        tokenContractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
        break;
      case "11":
        tokenSymbol = "USDT";
        feeType = 1;
        tokenContractAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
        break;
      default:
    }
  }
  return { feeType, tokenSymbol, tokenContractAddress };
};

const getFeeTypeAndTokenSymbolMapNetworkId = (networkId, type) => {
  if (networkId === 1) {
    return feeTypeAndTokenSymbolMapEthereum(type);
  } else if (networkId === 137) {
    return feeTypeAndTokenSymbolMapPolygon(type);
  } else {
    return { feeType: 0, tokenSymbol: "" };
  }
}

const getCoinHistoryInWallet = async (walletAddress, networkId, type) => {
  // Get token map info based on networkId and type
  const feeTypeAndTokenSymbolMap = getFeeTypeAndTokenSymbolMapNetworkId(networkId, type);
  const { tokenSymbol, tokenContractAddress, feeType } = feeTypeAndTokenSymbolMap;
  
  const isNativeCoin = tokenContractAddress === "0x0000000000000000000000000000000000000000" || 
                       tokenContractAddress === "0x";

  const apiBaseUrl = "https://api.etherscan.io/v2/api";

  const chainName = networkId === 1 ? "Ethereum" : "Polygon";

  try {
    console.log(
      `Fetching transactions for wallet ${walletAddress} on ${chainName} (ChainID: ${networkId})...`
    );
    console.log(`Looking for ${isNativeCoin ? 'NATIVE COIN' : 'TOKEN'}: ${tokenSymbol} (${tokenContractAddress})`);

    const normalTxUrl = `${apiBaseUrl}?chainid=${networkId}&module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${EtherscanAPIV2Key}`;

    const tokenTxUrl = `${apiBaseUrl}?chainid=${networkId}&module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${EtherscanAPIV2Key}`;

    const [normalRes, tokenRes] = await Promise.all([
      fetch(normalTxUrl),
      fetch(tokenTxUrl),
    ]);

    const normalData = await normalRes.json();
    const tokenData = await tokenRes.json();

    if (normalData.status === "0") {
      console.error(
        "Error fetching normal transactions:",
        normalData.message,
        normalData.result
      );
    }
    if (tokenData.status === "0") {
      console.error(
        "Error fetching token transactions:",
        tokenData.message,
        tokenData.result
      );
    }

    const normalTxs = normalData.result || [];
    const tokenTxs = tokenData.result || [];
    console.log(
      `Found ${normalTxs.length} normal transactions and ${tokenTxs.length} token transfers`
    );

    let filteredTransactions = [];
    
    if (isNativeCoin) {
      filteredTransactions = normalTxs.filter(tx => tx.value && tx.value !== "0");
      console.log(`Filtered ${filteredTransactions.length} native coin transactions (value > 0)`);
    } else {
      filteredTransactions = tokenTxs.filter(tx => 
        tx.contractAddress.toLowerCase() === tokenContractAddress.toLowerCase()
      );
      console.log(`Filtered ${filteredTransactions.length} token transfers for contract ${tokenContractAddress}`);
    }

    const transformedTransactions = filteredTransactions.map(tx => {
      let amount = "0";
      if (isNativeCoin) {
        const weiValue = BigInt(tx.value || "0");
        const decimals = 18;
        amount = (Number(weiValue) / Math.pow(10, decimals)).toFixed(18);
      } else {
        const decimals = parseInt(tx.tokenDecimal || "18");
        const value = BigInt(tx.value || "0");
        amount = (Number(value) / Math.pow(10, decimals)).toString();
      }

      const timestamp = parseInt(tx.timeStamp || "0");
      const date = new Date(timestamp * 1000);
      const created_at = date.toISOString().slice(0, 19).replace('T', ' ');

      return {
        hash: tx.hash,
        from: tx.from.toLowerCase(),
        to: tx.to.toLowerCase(),
        tokenName: tx.tokenName || tokenSymbol, 
        gas: parseFloat(tx.gasUsed || "0"),
        status: (tx.isError === "0" || tx.txreceipt_status === "1") ? 1 : 0, 
        amount: parseFloat(amount),
        created_at: created_at,
        timestamp: tx.timeStamp,
        type: feeType,
        name: tokenSymbol
      };
    });
    console.log('Transformed transactions:', transformedTransactions);
    return transformedTransactions;
  } catch (error) {
    console.error("Error fetching coin history:", error);
    throw error;
  }
};

(async () => {
  try {
    await getCoinHistoryInWallet(myWalletAddress, 1, 3);
  } catch (error) {
    console.error('Error in examples:', error);
  }
})();