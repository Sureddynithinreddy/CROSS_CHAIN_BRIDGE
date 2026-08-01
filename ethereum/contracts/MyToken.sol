// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @dev Test ERC-20 token for cross-chain bridge educational project.
 */
contract MyToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol, uint256 initialSupply) 
        ERC20(name, symbol) 
        Ownable(msg.sender) 
    {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Mint tokens for testing/faucet purposes.
     * Anyone can mint up to 1000 tokens per call for educational testing.
     */
    function mint(address to, uint256 amount) external {
        require(amount <= 10000 * 10**decimals(), "Mint amount exceeds faucet limit");
        _mint(to, amount);
    }
}
