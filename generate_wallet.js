import { ethers } from "ethers";
import fs from "fs";

const wallet = ethers.Wallet.createRandom();
console.log("ADDRESS=" + wallet.address);
console.log("PRIVATE_KEY=" + wallet.privateKey);

const envContent = `REACT_APP_FANTOM_RPC_URL=https://rpc.testnet.fantom.network/\nDEPLOYER_PRIVATE_KEY=${wallet.privateKey}\n`;
fs.writeFileSync("./frontend/.env", envContent);
fs.writeFileSync("./.env", envContent);
