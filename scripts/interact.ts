import { ethers } from "ethers";
import fs from "fs";

async function main() {
// Your deployed contract address
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

console.log("Connecting to the blockchain...");
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = await provider.getSigner();

const artifactJson = fs.readFileSync("./artifacts/contracts/Certificate.sol/Certificate.json", "utf8");
const artifact = JSON.parse(artifactJson);

// Connect to the deployed contract
const certificateContract = new ethers.Contract(contractAddress, artifact.abi, signer);

console.log("\n1. Issuing a test certificate to the blockchain...");
const tx = await certificateContract.issueCertificate(
"ITDS-2026-001",
"MacCarthy Collins Setor",
"MAT123456",
"BSc Information Technology",
"QmFakeIPFSHash123456"
);

await tx.wait(); // Wait for the block to be mined
console.log("Success! Transaction Hash:", tx.hash);

console.log("\n2. Verifying the certificate from the blockchain...");
// Fetch the data back from the blockchain using the ID
const result = await certificateContract.verifyCertificate("ITDS-2026-001");

console.log("\n--- VERIFIED DATA ---");
console.log("Student Name: ", result[0]);
console.log("Matric Number:", result[1]);
console.log("Degree:       ", result[2]);
console.log("IPFS Hash:    ", result[3]);
console.log("Issuer Addr:  ", result[4]);
console.log("---------------------\n");
}

main().catch((error) => {
console.error("ERROR CAUGHT:", error);
process.exitCode = 1;
});