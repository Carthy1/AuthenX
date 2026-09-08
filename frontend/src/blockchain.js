import { ethers } from "ethers";
import CertificateABI from "./abis/Certificate.json"; 
import DeployedAddress from "./abis/deployed_address.json";

// Local Development Settings (Hardhat node)
const LOCAL_RPC = "http://127.0.0.1:8545";
const LOCAL_CONTRACT = DeployedAddress.address || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const LOCAL_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Public Production Web Settings (Celo Sepolia Testnet)
const CELO_RPCS = [
  "https://11142220.rpc.thirdweb.com",
  "https://celo-sepolia.drpc.org",
  "https://rpc.ankr.com/celo_sepolia",
  "https://forno.celo-sepolia.celo-testnet.org"
];
const CELO_CONTRACT = process.env.REACT_APP_CELO_CONTRACT || DeployedAddress.address || "0x1937709F09a35e71f310F19f8BFF2e25C76Ad09b";
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
  const network = new ethers.Network("celo-sepolia", 11142220);
  let lastError = null;
  for (const rpcUrl of CELO_RPCS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, network, { staticNetwork: network });
      const signer = new ethers.Wallet(CELO_KEY, provider);
      const contract = new ethers.Contract(CELO_CONTRACT, CertificateABI.abi, signer);
      return contract;
    } catch (err) {
      console.warn(`RPC ${rpcUrl} failed, falling back to next...`, err);
      lastError = err;
    }
  }

  throw new Error(`All Celo Sepolia RPC connections failed. Last error: ${lastError?.message || lastError}`);
};