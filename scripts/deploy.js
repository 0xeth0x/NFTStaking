// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const {ethers} = require("hardhat");

async function main() {
    console.log("*** DEPLOYING ***");
    const NFTStaking = await ethers.getContractFactory("NFTStaking");
    const NFT_ADDRESS = "";
    const nftStaking = await NFTStaking.deploy(NFT_ADDRESS);

    console.log("NFT Staking Address: ", nftStaking.address);

    console.log("*** DONE ***");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
