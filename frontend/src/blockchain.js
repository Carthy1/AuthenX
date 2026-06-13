import { ethers } from "ethers";
import CertificateABI from "./abis/Certificate.json"; 

// Local Development Settings (Hardhat node)
const LOCAL_RPC = "http://127.0.0.1:8545";
const LOCAL_CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const LOCAL_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Public Production Web Settings (Celo Sepolia Testnet)
const CELO_RPCS = [
  "https://alfajores-forno.celo-testnet.org",
  "https://celo-alfajores-rpc.publicnode.com",
  "https://celo-alfajores.drpc.org",
  "https://rpc.ankr.com/celo_alfajores"
];
const CELO_CONTRACT = "0x553bB78666718E713FaB911C12c39F9c23Fc8cbb";
const CELO_KEY = "0x49d06dbec4bc0efc432fed917760a8faba6eb36dc627cc1166abd6ef7df1f43a";

export const getContract = async () => {
  // Automatically switch configurations if running on a live web host versus localhost
  const isLocal = typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (isLocal) {
    const provider = new ethers.JsonRpcProvider(LOCAL_RPC);
    const signer = new ethers.Wallet(LOCAL_KEY, provider);
    const contract = new ethers.Contract(LOCAL_CONTRACT, CertificateABI.abi, signer);
    return contract;
  }

  // Live web production environment with multi-RPC failover for high availability
  let lastError = null;
  for (const rpcUrl of CELO_RPCS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      // Validate connection to detect node failure
      await provider.getNetwork();
      
      const signer = new ethers.Wallet(CELO_KEY, provider);
      const contract = new ethers.Contract(CELO_CONTRACT, CertificateABI.abi, signer);
      return contract;
    } catch (err) {
      console.warn(`RPC node ${rpcUrl} is offline or rate-limiting. Checking backup node...`, err);
      lastError = err;
    }
  }

  throw new Error(`All Celo Sepolia RPC connection vectors failed. Last error: ${lastError?.message}`);
};