const { ethers } = require("ethers");
const CertificateABI = require("./frontend/src/abis/Certificate.json");

const CONTRACT_ADDRESS = "0x553bB78666718E713FaB911C12c39F9c23Fc8cbb";
const PRIVATE_KEY = "0x49d06dbec4bc0efc432fed917760a8faba6eb36dc627cc1166abd6ef7df1f43a";

async function grantRole() {
  try {
    console.log("Connecting...");
    const provider = new ethers.JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI.abi, signer);

    const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));
    console.log("ISSUER_ROLE:", ISSUER_ROLE);

    console.log("Granting role...");
    const tx = await contract.grantRole(ISSUER_ROLE, signer.address);
    console.log("Tx hash:", tx.hash);
    await tx.wait();
    console.log("Done!");
  } catch(e) {
    console.error("FAILED:", e);
  }
}
grantRole();
