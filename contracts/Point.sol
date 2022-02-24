//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract Point is
    Ownable,
    ERC20
{
    address public staking;

    constructor(
        address _staking
    ) ERC20("Point", "POINT") {
        staking = _staking;
    }

    function mint(address to, uint256 amount) external {
        require(
            msg.sender == staking,
            "Point::mint: only staking contract can mint"
        );
        _mint(to, amount);
    }

    function burn(address from, uint256 amount)
        external
        onlyOwner
    {
        _burn(from, amount);
    }
}