import { ethers } from "ethers";
import fs from "fs";

async function main() {
console.log("1. Connecting directly to local node...");
// Connect directly to the node you have running in terminal 1
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = await provider.getSigner();

console.log("2. Loading compiled contract blueprint...");
// Read the compiled JSON file directly from the artifacts folder
const artifactJson = fs.readFileSync("./artifacts/contracts/Certificate.sol/Certificate.json", "utf8");
const artifact = JSON.parse(artifactJson);

console.log("3. Deploying contract to blockchain...");
// Create a factory using pure ethers, bypassing Hardhat's broken plugin
const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
const certificate = await factory.deploy();

await certificate.waitForDeployment();

console.log("4. SUCCESS! Certificate deployed to:", await certificate.getAddress());

console.log("5. Granting ISSUER_ROLE to the deployer...");
const ISSUER_ROLE = await certificate.ISSUER_ROLE();
const grantTx = await certificate.grantRole(ISSUER_ROLE, signer.address);
await grantTx.wait();
console.log("6. SUCCESS! ISSUER_ROLE granted implicitly to the deployer.");
}

main().catch((error) => {
console.error("ERROR CAUGHT:", error);
process.exitCode = 1;
});