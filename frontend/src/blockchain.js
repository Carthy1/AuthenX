import { ethers } from "ethers";
// We will grab the ABI from the folder you created earlier
import CertificateABI from "./abis/Certificate.json"; 
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const getContract = async () => {
  // Connect to the local Hardhat node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Get the signer (Account #0 from your local node)
  const signer = await provider.getSigner();
  
  // Create and return the contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI.abi, signer);
  return contract;
};