# AuthenX: Decentralized Academic Credential Verification

AuthenX is an academic credential verification platform designed to prevent diploma fraud. It uses a React frontend, Firebase for data management, and Solidity smart contracts to ensure credentials are secure and verifiable.

## Live Application
Hosted Link: https://authen-x-git-main-carthy1s-projects.vercel.app/

## The Team
- MacCarthy Collins Setor: Group Leader

## System Architecture
The platform is built using the following technologies:
*   Frontend: React interface with Role-Based Access Control (RBAC).
*   Smart Contracts: Solidity contracts for issuing and verifying credentials.
*   Database: Firebase Firestore for application data.
*   Storage: IPFS (via Pinata) for storing digital credentials.

## How to Run Locally

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
Built for the AmaliTech Project Submission.
