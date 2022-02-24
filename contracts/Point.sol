//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/*
 * @dev The {Point} is an ERC20 contract that represents rewards
 * for staking the NFT in staking contract.
 *
 * It allows minting by the {staking} contract and burning by the {owner}.
 *
 * The token is not transferable hence the {transfer} and
 * {transferFrom} functions revert.
 **/
contract Point is
    Ownable,
    ERC20
{
    // Address of staking contract.
    address public staking;

    constructor(
        address _staking
    ) ERC20("Point", "POINT") {
        staking = _staking;
    }

    /*
     * @dev Allows minting of {Point} tokens.
     *
     * Requirements:
     * - Can only be called by the staking contract.
     **/
    function mint(address to, uint256 amount) external {
        require(
            msg.sender == staking,
            "Point::mint: only staking contract can mint"
        );
        _mint(to, amount);
    }

    /*
     * @dev Allows burning of {Point} tokens.
     *
     * Requirements:
     * - Can only be called by the owner.
     **/
    function burn(address from, uint256 amount)
        external
        onlyOwner
    {
        _burn(from, amount);
    }

    /*
     * @dev Allows reverting of {transferFrom}.
     **/
    function transferFrom(
        address from,
        address to,
        uint256 amount
    )
        public
        pure
        override
        returns (bool)
    {
        revert(
            "Point::transferFrom: not allowed"
        );
        return false;
    }

    /*
     * @dev Allows reverting of {transfer}.
     **/
    function transfer(address to, uint256 amount)
        public
        pure
        override
        returns (bool)
    {
        revert(
            "Point::transfer: not allowed"
        );
        return false;
    }
}