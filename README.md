# 🛡️ AuthenX: Decentralized Academic Credential Verification

AuthenX is an enterprise-grade academic credential verification platform designed to completely eliminate diploma fraud. By combining the speed of a Web2 frontend (React + Firebase) with the cryptographic immutability of Web3 (Solidity + IPFS), AuthenX empowers authorized institutions to issue digital credentials that can be instantly and mathematically verified by employers.

## 🔗 Live Application
**Hosted Link:** `[INSERT VERCEL LINK HERE]`

## 👥 The Team
- **[MacCarthy Collins Setor]**: [Group Leader]

## 🏗️ System Architecture
The platform operates on a hybrid Web2/Web3 architecture:
*   **The Governance Terminal (React Frontend):** A modern, glassmorphic UI built around Role-Based Access Control (RBAC).
*   **The Consensus Ledger (Solidity Smart Contracts):** The immutable Source of Truth ensuring only approved institutional nodes can issue credentials.
*   **The Database (Firebase Firestore):** High-speed layer ensuring rapid UI performance and metadata tracking.
*   **Decentralized Storage (IPFS/Pinata):** Digital artifacts are pinned to the InterPlanetary File System.

## 🚀 How to Run Locally

If you are a technical reviewer and wish to run the stack locally:

### 1. Clone & Install
```bash
git clone https://github.com/Carthy1/AuthenX.git
cd CertificateVerification
npm install
```

### 2. Frontend Execution
Navigate to the frontend directory to launch the React interface:
```bash
cd frontend
npm install
npm start
```

### 3. Blockchain Execution (Hardhat)
To spin up a local Ethereum node and test the smart contracts:
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

---
*Built for the AmaliTech Project Submission.*
