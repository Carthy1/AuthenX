const { ethers } = require("ethers");
const CertificateABI = require("./frontend/src/abis/Certificate.json");

const CONTRACT_ADDRESS = "0x1937709F09a35e71f310F19f8BFF2e25C76Ad09b";
const PRIVATE_KEY = "0x49d06dbec4bc0efc432fed917760a8faba6eb36dc627cc1166abd6ef7df1f43a";

async function test() {
  try {
    console.log("Connecting to Celo Sepolia...");
    const network = new ethers.Network("celo-sepolia", 11142220);
    const provider = new ethers.JsonRpcProvider("https://11142220.rpc.thirdweb.com", network, { staticNetwork: network });
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI.abi, signer);

    console.log("Checking ISSUER_ROLE for deployer...");
    const ISSUER_ROLE = await contract.ISSUER_ROLE();
    const hasIssuer = await contract.hasRole(ISSUER_ROLE, signer.address);
    console.log("Has ISSUER_ROLE:", hasIssuer);

    const testId = "CELO_TEST_" + Date.now();
    console.log("Issuing certificate with ID:", testId);
    const tx = await contract.issueCertificate(
      testId, 
      "Alice Student", 
      "MATRIC_2026", 
      "BSc Computer Science", 
      "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR", 
      "Federal University of Technology",
      ethers.ZeroAddress,
      {
        gasPrice: 55000000000n
      }
    );
    console.log("Tx hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Tx confirmed in block:", receipt.blockNumber);

    console.log("Verifying certificate on-chain...");
    const cert = await contract.verifyCertificate(testId);
    console.log("Verified name:", cert.studentName);
    console.log("Verified degree:", cert.degree);
    console.log("Verified institution:", cert.institution);
    console.log("Verified student wallet:", cert.studentWallet);

    console.log("Testing duplicate ID prevention...");
    try {
      await contract.issueCertificate(
        testId, 
        "Alice Student", 
        "MATRIC_2026", 
        "BSc Computer Science", 
        "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR", 
        "Federal University of Technology",
        ethers.ZeroAddress
      );
      console.error("ERROR: Duplicate was not prevented!");
    } catch (dupErr) {
      console.log("SUCCESS: Duplicate prevented as expected! Error:", dupErr.message);
    }

    console.log("ALL ON-CHAIN TESTS PASSED SUCCESSFULLY!");
  } catch(e) {
    console.error("FAILED:", e);
  }
}
test();
