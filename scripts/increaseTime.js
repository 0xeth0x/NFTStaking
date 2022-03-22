// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const {ethers} = require("hardhat");

async function main() {
    // console.log("*** DEPLOYING ***");
    // const [owner] = await ethers.getSigners();
    // // const NFT = await ethers.getContractFactory("NFT");
    // const NFTStaking = await ethers.getContractFactory("NFTStaking");
    // // const nft = await NFT.deploy();
    // const nftStaking = NFTStaking.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    // console.log(await nftStaking.getPointsEarningPerDayByUser(owner.address))
    //
    // console.log("NFT address: ", nft.address)
    // console.log("NFT Staking Address: ", nftStaking.address);
    //
    // const [owner] = await ethers.getSigners();
    // await nft.mint(owner.address);
    // await nft.mint(owner.address);
    // console.log("*** DONE ***");
    await hre.ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
    await hre.ethers.provider.send("evm_mine");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
