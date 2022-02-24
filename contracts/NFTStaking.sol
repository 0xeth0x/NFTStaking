//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Point } from "./Point.sol";

/*
 * @dev NFT Staking contract allows staking of NFT to earn rewards in point
 * token.
 *
 * Each NFT is has a specific rarity associated with it that allows the
 * staker accrue specific amount of Point tokens per day.
 *
 * The staker can claim their Point rewards every 24 hours and unstaking
 * automatically claims Point rewards for the user.
 **/
contract NFTStaking is Ownable {
    // Address of NFT token.
    IERC721 public nft;

    // Address of Point ERC20 token that is paid as reward.
    Point public point;

    /*
     * @dev A struct representing stake of user.
     * tokenId -> The id of the token staked by user.
     * lastPointsClaimedAt -> The timestamp at which the last claiming of rewards
     * happened for this token id.
     **/
    struct Stake {
        uint256 tokenId;
        uint256 lastPointsClaimedAt;
    }

    // mapping of users addresses to the list of stakes.
    mapping(address => Stake[]) public stakesByUser;

    // mapping of token ids to rarity numbers.
    mapping(uint256 => uint256) public rarityNumberByTokenId;

    // mapping of rarity numbers to Points rewards per day.
    mapping(uint256 => uint256) public pointsPerDayByRarityNumber;

    event Staked(address user, uint256 tokenId);

    event Unstaked(address user, uint256 tokenId);

    constructor(IERC721 _nft) {
        nft = _nft;
        point = new Point(address(this));
    }

    /*
     * @dev Allows populating the mapping {rarityNumberByTokenId} by accepting
     * lists of {tokenIds} and {rarityNumbers}.
     *
     * Requirements:
     * - Can only called by owner.
     * - Both lists must be of the same length.
     **/
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

    /*
     * @dev Allows populating the mapping {pointsPerDayByRarityNumber} by accepting
     * lists of {rarityNumbers} and {pointsPerDay}.
     *
     * Requirements:
     * - Can only called by owner.
     * - Both lists must be of the same length.
     **/
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

    /*
     * @dev Allows staking of NFT token having tokenId of {id}.
     *
     * It calls {transferFrom} function on the {NFT} contract to transfer
     * the staked token to the contract itself.
     *
     * Requirements:
     * - The token being staked with tokenId {id} must be approved to
     * the contract.
     **/
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

    /*
     * @dev Allows claiming of Point rewards by the user across all of its
     * NFT staked.
     *
     * It updates {lastPointsClaimedAt} for all of the NFT staked by the calling
     * user.
     **/
    function claimPoints() public {
        Stake[] storage stakes = stakesByUser[msg.sender];

        for (uint256 i = 0; i < stakes.length; i++) {
            Stake storage _stake = stakes[i];

            uint256 claimablePoints = getClaimablePointsByStake(_stake);
            if (claimablePoints != 0) point.mint(msg.sender, claimablePoints);

            _stake.lastPointsClaimedAt = block.timestamp;
        }
    }

    /*
     * @dev Allows unstaking of NFT having tokenId {id}.
     *
     * It claims the Point rewards for user for all of its NFT stakes.
     *
     * Requirements:
     * - The tokenId {id} must represent a valid NFT stake.
     **/
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

    /*
     * @dev Allows unstaking of all NFTs by the users that it had staked.
     *
     * It claims the Point tokens accrued by the user across all of its NFTs.
     **/
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

    /*
     * @dev Returns total number of Point tokens being accrued by the user per day
     * across all of its NFT stakes.
     **/
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

    /*
     * @dev Returns the claimable Point token amount available from
     * the provided {_stake}.
     **/
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