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

    it('populateRarityNumberByTokenId fails when called by non owner', async () => {
        const [, nonOwner] = await ethers.getSigners();
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        const tokenIds = [
            1111,
            2222,
            3333
        ];

        const rarityNumbers = [
            big(1),
            big(2),
            big(3)
        ];

        try {
            await nftStaking.connect(nonOwner).populateRarityNumberByTokenId(tokenIds, rarityNumbers);
            assert.fail(
                "populateRarityNumberByTokenId successfully called by non owner"
            );
        } catch (e) {
            expect(e.message).to.include(
                "Ownable: caller is not the owner"
            );
        }
    });

    it('populateRarityNumberByTokenId fails when with mismatched lengths', async () => {
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        const tokenIds = [
            1111,
            2222,
            3333
        ];

        const rarityNumbers = [
            big(1),
            big(2),
        ];

        try {
            await nftStaking.populateRarityNumberByTokenId(tokenIds, rarityNumbers);
            assert.fail(
                "populateRarityNumberByTokenId successfully called with mismatched lengths"
            );
        } catch (e) {
            expect(e.message).to.include(
                "NFTStaking::populateRarityNumberTokenId: invalid array lengths"
            );
        }
    });

    it('successfully call populateRarityNumberByTokenId ', async () => {
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        const tokenIds = [
            1111,
            2222,
            3333
        ];

        const rarityNumbers = [
            big(1),
            big(2),
            big(3)
        ];

        await nftStaking.populateRarityNumberByTokenId(tokenIds, rarityNumbers);

        tokenIds.forEach(
            async (
                tokenId,
                idx
            ) => expect(await nftStaking.rarityNumberByTokenId(tokenId))
                .to.be.equal(rarityNumbers[idx])
        );
    });

    it('populatePointsPerDayByRarityNumber fails when called by non owner', async () => {
        const [, nonOwner] = await ethers.getSigners();
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        const rarityNumbers = [
            1,
            2,
            3
        ];

        const pointsPerDay = [
            big(100),
            big(200),
            big(300)
        ];

        try {
            await nftStaking.connect(nonOwner).populatePointsPerDayByRarityNumber(rarityNumbers, pointsPerDay);
            assert.fail(
                "populatePointsPerDayByRarityNumber successfully called by non owner"
            );
        } catch (e) {
            expect(e.message).to.include(
                "Ownable: caller is not the owner"
            );
        }
    });

    it('populatePointsPerDayByRarityNumber fails when with mismatched lengths', async () => {
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        const rarityNumbers = [
            1,
            2,
            3
        ];

        const pointsPerDay = [
            big(100),
            big(200),
        ];

        try {
            await nftStaking.populatePointsPerDayByRarityNumber(rarityNumbers, pointsPerDay);
            assert.fail(
                "populatePointsPerDayByRarityNumber successfully called with mismatched lengths"
            );
        } catch (e) {
            expect(e.message).to.include(
                "NFTStaking::populatePointsPerDayByRarityNumber: invalid array lengths"
            );
        }
    });

    it('successfully call populatePointsPerDayByRarityNumber ', async () => {
        const NFTStaking = await ethers.getContractFactory("NFTStaking");
        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy();
        const nftStaking = await NFTStaking.deploy(nft.address);

        const rarityNumbers = [
            1,
            2,
            3
        ];

        const pointsPerDay = [
            big(100),
            big(200),
            big(300)
        ];

        await nftStaking.populatePointsPerDayByRarityNumber(rarityNumbers, pointsPerDay);

        rarityNumbers.forEach(
            async (
                rarityNumber,
                idx
            ) => expect(await nftStaking.pointsPerDayByRarityNumber(rarityNumber))
                .to.be.equal(pointsPerDay[idx])
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

        await nftStaking.populateRarityNumberByTokenId([0], [1]);
        await nftStaking.populatePointsPerDayByRarityNumber([1], [200]);

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

        await nftStaking.populateRarityNumberByTokenId([0], [1]);
        await nftStaking.populatePointsPerDayByRarityNumber([1], [200]);

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

        await nftStaking.populateRarityNumberByTokenId([0], [1]);
        await nftStaking.populatePointsPerDayByRarityNumber([1], [200]);

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

        await nftStaking.populateRarityNumberByTokenId([0, 1], [1, 2]);
        await nftStaking.populatePointsPerDayByRarityNumber([1, 2], [200, 400]);

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