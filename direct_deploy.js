import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Starting direct deployment to Celo Sepolia...");
  
  const network = new ethers.Network("celo-sepolia", 11142220);
  const provider = new ethers.JsonRpcProvider("https://11142220.rpc.thirdweb.com", network, { staticNetwork: network });
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
  const contract = await factory.deploy({
    gasPrice: 55000000000n,
    gasLimit: 2800000
  });
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("Contract successfully deployed to:", address);
  
  // Save the address
  fs.writeFileSync("deployed_address.txt", address);
  fs.writeFileSync("./frontend/src/abis/deployed_address.json", JSON.stringify({ address }, null, 2));

  // Verify roles
  const ISSUER_ROLE = await contract.ISSUER_ROLE();
  const hasIssuer = await contract.hasRole(ISSUER_ROLE, wallet.address);
  console.log("Deployer has ISSUER_ROLE:", hasIssuer);
  if (!hasIssuer) {
    console.log("Granting ISSUER_ROLE to deployer...");
    const tx = await contract.grantRole(ISSUER_ROLE, wallet.address);
    await tx.wait();
    console.log("ISSUER_ROLE granted successfully!");
  }
  console.log("Deployment and verification complete!");
}

main().catch(console.error);
