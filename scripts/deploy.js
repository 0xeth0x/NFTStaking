// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const {ethers} = require("hardhat");
const big = num => ethers.BigNumber.from(num);

async function main() {
    console.log("*** DEPLOYING ***");
    const NFT = await ethers.getContractFactory("NFT");
    const NFTStaking = await ethers.getContractFactory("NFTStaking");
    const nft = await NFT.deploy();
    const nftStaking = await NFTStaking.deploy(nft.address);

    console.log("NFT address: ", nft.address)
    console.log("NFT Staking Address: ", nftStaking.address);

    const [owner] = await ethers.getSigners();
    await nft.mint(owner.address);
    await nft.mint(owner.address);
    console.log("*** DONE ***");

    await nftStaking.populateTierNumberByTokenId([
        [0, 1], [1, 2]
    ]);

    await nftStaking.populatePointsPerDayByTierNumber([
        [1, big(200).mul(big(10).pow(18))],
        [2, big(800).mul(big(10).pow(18))]
    ]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
