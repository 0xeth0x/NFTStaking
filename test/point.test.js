const {ethers} = require("hardhat");
const {expect, assert} = require("chai");

const big = num => ethers.BigNumber.from(num);

describe('Point', () => {
    it('should deploy successfully', async () => {
        const [nftStaking] = await ethers.getSigners();
        const Point = await ethers.getContractFactory("Point");
        const point = await Point.deploy(nftStaking.address);

        expect(await point.staking()).to.be.equal(nftStaking.address);
    });

    it('should not mint Point by nonOwner', async () => {
        const [nftStaking, nonOwner, addr1] = await ethers.getSigners();
        const Point = await ethers.getContractFactory("Point");
        const point = await Point.deploy(nftStaking.address);

        try {
            await point.connect(nonOwner).mint(addr1.address, 1);
            assert.fail(
                "Successfully minted by non owner"
            );
        } catch (e) {
            expect(e.message).to.include(
                "Point::mint: only staking contract can mint"
            );
        }
    });

    it('should mint by owner', async () => {
        const [nftStaking, addr1] = await ethers.getSigners();
        const Point = await ethers.getContractFactory("Point");
        const point = await Point.deploy(nftStaking.address);

        await point.mint(addr1.address, 1);
        expect(await point.balanceOf(addr1.address)).to.be.equal(big(1));
    });

    it('should not transfer', async () => {
        const [nftStaking, addr1] = await ethers.getSigners();
        const Point = await ethers.getContractFactory("Point");
        const point = await Point.deploy(nftStaking.address);

        await point.mint(addr1.address, 1);

        try {
            await point.connect(addr1).transfer(nftStaking.address, 1);
            assert.fail(
                "Successfully called transfer"
            );
        } catch (e) {
            expect(e.message).to.include(
                "Point::transfer: not allowed"
            );
        }
    });

    it('should not transferFrom', async () => {
        const [nftStaking, addr1] = await ethers.getSigners();
        const Point = await ethers.getContractFactory("Point");
        const point = await Point.deploy(nftStaking.address);

        await point.mint(addr1.address, 1);

        try {
            await point.connect(addr1).transferFrom(addr1.address, nftStaking.address, 1);
            assert.fail(
                "Successfully called transferFrom"
            );
        } catch (e) {
            expect(e.message).to.include(
                "Point::transferFrom: not allowed"
            );
        }
    });
});