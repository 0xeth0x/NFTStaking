//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFT is ERC721 {
    uint256 public id;
    constructor() ERC721("NFT", "NFT") {}

    function mint(address to) external {
        _mint(to, id++);
    }
}