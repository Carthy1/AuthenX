import { ethers } from "ethers";
// We will grab the ABI from the folder you created earlier
import CertificateABI from "./abis/Certificate.json"; 
const CONTRACT_ADDRESS = "0x553bB78666718E713FaB911C12c39F9c23Fc8cbb";

export const getContract = async () => {
  // Connect to the public Celo Sepolia network
  const provider = new ethers.JsonRpcProvider("https://forno.celo-sepolia.celo-testnet.org");
  
  // Get the signer (Account #0 from your local node)
  const signer = await provider.getSigner();
  
  // Create and return the contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI.abi, signer);
  return contract;
};