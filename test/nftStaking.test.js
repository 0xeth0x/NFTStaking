const { ethers } = require("hardhat");
const { expect, assert } = require("chai");

const big = num => ethers.BigNumber.from(num);

describe('NFTStaking', () => {
    it('should deploy successfully', async () => {
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        expect(await nftStaking.nft()).to.be.equal(nft.address);
    });

    it('populateTierNumberByTokenId fails when called by non owner', async () => {
        const [, nonOwner] = await ethers.getSigners();
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        const tokenIdAndTier = [
            [1111, big(1)],
            [2222, big(2)],
            [3333, big(3)]
        ];

        try {
            await nftStaking.connect(nonOwner).populateTierNumberByTokenId(tokenIdAndTier);
            assert.fail(
                "populateTierNumberByTokenId successfully called by non owner"
            );
        } catch (e) {
            expect(e.message).to.include(
                "Ownable: caller is not the owner"
            );
        }
    });

    it('successfully call populateTierNumberByTokenId ', async () => {
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        const tokenIdAndTier = [
            [1111, big(1)],
            [2222, big(2)],
            [3333, big(3)]
        ];

        await nftStaking.populateTierNumberByTokenId(tokenIdAndTier);

        tokenIdAndTier.forEach(
            async (
                [tokenId, tierNumber],
                idx
            ) => expect(await nftStaking.tierNumberByTokenId(tokenId))
                .to.be.equal(tierNumber)
        );
    });

    it('populatePointsPerDayByTierNumber fails when called by non owner', async () => {
        const [, nonOwner] = await ethers.getSigners();
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        const tierAndPointsPerDay = [
            [1, big(100)],
            [2, big(200)],
            [3, big(300)]
        ];

        try {
            await nftStaking.connect(nonOwner).populatePointsPerDayByTierNumber(tierAndPointsPerDay);
            assert.fail(
                "populatePointsPerDayByTierNumber successfully called by non owner"
            );
        } catch (e) {
            expect(e.message).to.include(
                "Ownable: caller is not the owner"
            );
        }
    });

    it('successfully call populatePointsPerDayByTierNumber ', async () => {
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        const tierAndPointsPerDay = [
            [1, big(100)],
            [2, big(200)],
            [3, big(300)]
        ];

        await nftStaking.populatePointsPerDayByTierNumber(tierAndPointsPerDay);

        tierAndPointsPerDay.forEach(
            async (
                [tierNumber, pointsPerDay],
                idx
            ) => expect(await nftStaking.pointsPerDayByTierNumber(tierNumber))
                .to.be.equal(pointsPerDay)
        );
    });

    it('should not stake if id is not approved', async () => {
        const [addr1] = await ethers.getSigners();
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        const tokenId = big(0);
        await nft.mint(addr1.address);

        try {
            await nftStaking.stake(tokenId);
            assert.fail(
                "staked with non approved is"
            );
        } catch (e) {
            expect(e.message).to.include(
                "NFTStaking::stake: staking contract is not approved for the given token id"
            );
        }
    });

    it('should successfully stake', async () => {
        const [addr1] = await ethers.getSigners();
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        const tokenId = big(0);

        await nft.mint(addr1.address);
        await nft.approve(nftStaking.address, tokenId);

        await nftStaking.stake(tokenId);

        expect(await nft.ownerOf(tokenId))
            .to.be.equal(nftStaking.address);

        expect((await nftStaking.stakesByUser(addr1.address, 0)).tokenId)
            .to.be.equal(tokenId);

        expect((await nftStaking.stakesByUser(addr1.address, 0)).lastPointsClaimedAt)
            .to.be.not.equal(big(0));
    });

    it('should claim points', async () => {
        const [addr1] = await ethers.getSigners();
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const Point = await ethers.getContractFactory("Point");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);
        const point = await Point.attach(await nftStaking.point());

        const tokenId = big(0);

        await nftStaking.populateTierNumberByTokenId([[0, 1]]);
        await nftStaking.populatePointsPerDayByTierNumber([[1, 200]]);

        await nft.mint(addr1.address);
        await nft.approve(nftStaking.address, tokenId);

        await nftStaking.stake(tokenId);

        await ethers.provider.send("evm_increaseTime", [86400]);
        await ethers.provider.send("evm_mine");

        await nftStaking.claimPoints();

        expect(await point.balanceOf(addr1.address))
            .to.be.equal(big(200));
    });

    it('should fail to unstake token with wrong id', async () => {
        const [addr1] = await ethers.getSigners();
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const Point = await ethers.getContractFactory("Point");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);
        const point = await Point.attach(await nftStaking.point());

        const tokenId = big(0);

        await nftStaking.populateTierNumberByTokenId([[0, 1]]);
        await nftStaking.populatePointsPerDayByTierNumber([[1, 200]]);

        await nft.mint(addr1.address);
        await nft.approve(nftStaking.address, tokenId);

        await nftStaking.stake(tokenId);

        await ethers.provider.send("evm_increaseTime", [86400]);
        await ethers.provider.send("evm_mine");

        try {
            await nftStaking.unstakeById(big(1));
            assert.fail(
                "unstaked wrong token id"
            );
        } catch (e) {
            expect(e.message).to.include(
                "NFTStaking::unstake: invalid token id provided"
            );
        }
    });

    it('should unstake by id', async () => {
        const [addr1] = await ethers.getSigners();
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const Point = await ethers.getContractFactory("Point");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);
        const point = await Point.attach(await nftStaking.point());

        const tokenId = big(0);

        await nftStaking.populateTierNumberByTokenId([[0, 1]]);
        await nftStaking.populatePointsPerDayByTierNumber([[1, 200]]);

        await nft.mint(addr1.address);
        await nft.approve(nftStaking.address, tokenId);

        await nftStaking.stake(tokenId);

        await ethers.provider.send("evm_increaseTime", [86400]);
        await ethers.provider.send("evm_mine");

        await nftStaking.unstakeById(tokenId);

        expect(await point.balanceOf(addr1.address))
            .to.be.equal(big(200));

        expect(await nft.ownerOf(tokenId))
            .to.be.equal(addr1.address);

        // expect((await nftStaking.stakesByUser(addr1.address, 0)).tokenId)
        //     .to.be.equal(big(0));

        // expect((await nftStaking.stakesByUser(addr1.address, 0)).lastPointsClaimedAt)
        //     .to.be.not.equal(big(0));
    });

    it('should unstake all', async () => {
        const [addr1] = await ethers.getSigners();
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const Point = await ethers.getContractFactory("Point");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);
        const point = await Point.attach(await nftStaking.point());

        const tokenIds = [big(0), big(1)];

        await nftStaking.populateTierNumberByTokenId([[0, 1], [1, 2]]);
        await nftStaking.populatePointsPerDayByTierNumber([[1, 200], [2, 400]]);

        await nft.mint(addr1.address);
        await nft.mint(addr1.address);
        await nft.approve(nftStaking.address, tokenIds[0]);
        await nft.approve(nftStaking.address, tokenIds[1]);

        await nftStaking.stake(tokenIds[0]);
        await nftStaking.stake(tokenIds[1]);

        await ethers.provider.send("evm_increaseTime", [86400]);
        await ethers.provider.send("evm_mine");

        expect(await nftStaking.getPointsEarningPerDayByUser(addr1.address))
            .to.be.equal(big(600));

        await nftStaking.unstakeAll();

        expect(await point.balanceOf(addr1.address))
            .to.be.equal(big(600));

        expect(await nft.ownerOf(tokenIds[0]))
            .to.be.equal(addr1.address);

        expect(await nft.ownerOf(tokenIds[1]))
            .to.be.equal(addr1.address);

        // expect((await nftStaking.stakesByUser(addr1.address, 0)).tokenId)
        //     .to.be.equal(big(0));

        // expect((await nftStaking.stakesByUser(addr1.address, 0)).lastPointsClaimedAt)
        //     .to.be.not.equal(big(0));
    });
});