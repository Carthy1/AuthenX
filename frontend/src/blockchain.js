import { ethers } from "ethers";
// We will grab the ABI from the folder you created earlier
import CertificateABI from "./abis/Certificate.json"; 
const CONTRACT_ADDRESS = "0x553bB78666718E713FaB911C12c39F9c23Fc8cbb";

// Secure testnet-only deployment key for seamless operations
const PRIVATE_KEY = "0x49d06dbec4bc0efc432fed917760a8faba6eb36dc627cc1166abd6ef7df1f43a";

export const getContract = async () => {
  // Connect to the public Celo Sepolia network
  const provider = new ethers.JsonRpcProvider("https://forno.celo-sepolia.celo-testnet.org");
  
  // Use the dedicated testnet wallet to sign transactions seamlessly without MetaMask
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // Create and return the contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI.abi, signer);
  return contract;
};