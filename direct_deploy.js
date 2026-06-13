import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Starting direct deployment to Celo Sepolia...");
  
  const provider = new ethers.JsonRpcProvider("https://forno.celo-sepolia.celo-testnet.org");
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("Missing DEPLOYER_PRIVATE_KEY in .env");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Deploying from account:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance), "CELO");
  
  if (balance === 0n) {
    throw new Error("Account has zero balance! The faucet claim might not have completed.");
  }

  // Load the compiled contract
  const artifactJson = fs.readFileSync("./frontend/src/abis/Certificate.json", "utf8");
  const artifact = JSON.parse(artifactJson);
  
  console.log("Contract loaded. Deploying...");
  
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("Contract successfully deployed to:", address);
  
  // Save the address
  fs.writeFileSync("deployed_address.txt", address);
  fs.writeFileSync("./frontend/src/abis/deployed_address.json", JSON.stringify({ address }, null, 2));
}

main().catch(console.error);
