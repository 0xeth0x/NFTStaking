//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Point } from "./Point.sol";
import "hardhat/console.sol";

contract NFTStaking is Ownable {
    IERC721 public nft;

    Point public point;

    struct Stake {
        uint256 tokenId;
        uint256 lastPointsClaimedAt;
    }

    mapping(address => Stake[]) public stakesByUser;

    mapping(uint256 => uint256) public rarityNumberByTokenId;

    mapping(uint256 => uint256) public pointsPerDayByRarityNumber;

    event Staked(address user, uint256 tokenId);

    event Unstaked(address user, uint256 tokenId);

    constructor(IERC721 _nft) {
        nft = _nft;

        point = new Point(address(this));
    }

    function populateRarityNumberByTokenId(
        uint256[] calldata tokenIds,
        uint256[] calldata rarityNumbers
    )
        external
        onlyOwner
    {
        require(
            tokenIds.length == rarityNumbers.length,
            "NFTStaking::populateRarityNumberTokenId: invalid array lengths"
        );

        for (uint256 i = 0; i < tokenIds.length; i++)
            rarityNumberByTokenId[tokenIds[i]] = rarityNumbers[i];
    }

    function populatePointsPerDayByRarityNumber(
        uint256[] calldata rarityNumbers,
        uint256[] calldata pointsPerDay
    )
        external
        onlyOwner
    {
        require(
            rarityNumbers.length == pointsPerDay.length,
            "NFTStaking::populatePointsPerDayByRarityNumber: invalid array lengths"
        );

        for (uint256 i = 0; i < rarityNumbers.length; i++)
            pointsPerDayByRarityNumber[rarityNumbers[i]] = pointsPerDay[i];
    }

    function stake(uint256 id) external {
        require(
            nft.getApproved(id) == address(this),
            "NFTStaking::stake: staking contract is not approved for the given token id"
        );

        stakesByUser[msg.sender].push(
            Stake(
                id,
                block.timestamp
            )
        );

        nft.transferFrom(
            msg.sender,
            address(this),
            id
        );

        emit Staked(msg.sender, id);
    }

    function claimPoints() public {
        Stake[] storage stakes = stakesByUser[msg.sender];

        for (uint256 i = 0; i < stakes.length; i++) {
            Stake storage _stake = stakes[i];

            uint256 claimablePoints = getClaimablePointsByStake(_stake);
            if (claimablePoints != 0) point.mint(msg.sender, claimablePoints);

            _stake.lastPointsClaimedAt = block.timestamp;
        }
    }

    function unstakeById(uint256 id) external {
        claimPoints();

        Stake[] storage stakes = stakesByUser[msg.sender];
        Stake memory _stake;

        uint256 length = stakes.length;
        uint256 i;
        for (i = 0; i < length; i++) {
            if (stakes[i].tokenId == id) {
                _stake = stakes[i];
                break;
            }
        }

        require(
            _stake.lastPointsClaimedAt != 0,
            "NFTStaking::unstake: invalid token id provided"
        );

        stakes[i] = stakes[length - 1];
        stakes.pop();

        nft.transferFrom(
            address(this),
            msg.sender,
            id
        );

        emit Unstaked(msg.sender, id);
    }

    function unstakeAll() external {
        claimPoints();

        Stake[] storage stakes = stakesByUser[msg.sender];

        uint256 length = stakes.length;
        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = stakes[i].tokenId;
            nft.transferFrom(
                address(this),
                msg.sender,
                tokenId
            );

            emit Unstaked(msg.sender, tokenId);
        }

        delete stakesByUser[msg.sender];
    }

    function getPointsEarningPerDayByUser(
        address user
    )
        public
        view
        returns (uint256)
    {
        Stake[] memory stakes = stakesByUser[user];
        uint256 totalPointsPerDay;

        for (uint256 i = 0; i < stakes.length; i++) {
            Stake memory _stake = stakes[i];
            uint256 rarityNumber = rarityNumberByTokenId[_stake.tokenId];
            uint256 pointsPerDay = pointsPerDayByRarityNumber[rarityNumber];

            totalPointsPerDay += pointsPerDay;
        }

        return totalPointsPerDay;
    }

    function getClaimablePointsByStake(Stake storage _stake)
        private
        view
        returns (uint256)
    {
        uint256 rarityNumber = rarityNumberByTokenId[_stake.tokenId];
        uint256 pointsPerDay = pointsPerDayByRarityNumber[rarityNumber];

        return
            (block.timestamp - _stake.lastPointsClaimedAt) * pointsPerDay / 24 hours;
    }
}