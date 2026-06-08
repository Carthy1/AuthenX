const { ethers } = require("ethers");

async function checkBalances() {
  const userAddress = "0x69149f8c72c038B9BF24BC822aA7A51955Cc71D2";
  const genAddress = "0x46689e2031C0006c8D10027002D92094f0947513";

  try {
    const sepoliaProvider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
    const sepoliaBalance = await sepoliaProvider.getBalance(userAddress);
    console.log("User Sepolia ETH:", ethers.formatEther(sepoliaBalance));
  } catch (e) {
    console.log("Sepolia check failed:", e.message);
  }

  try {
    const fantomProvider = new ethers.JsonRpcProvider("https://rpc.testnet.fantom.network");
    const fantomBalance = await fantomProvider.getBalance(genAddress);
    console.log("Gen Fantom FTM:", ethers.formatEther(fantomBalance));
  } catch (e) {
    console.log("Fantom check failed:", e.message);
  }
}

checkBalances();
