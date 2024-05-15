// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/finance/VestingWallet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BrainVestingWallet is VestingWallet, Ownable {
    constructor(address beneficiaryAddress, uint64 startTimestamp, uint64 durationSeconds) VestingWallet(beneficiaryAddress, startTimestamp, durationSeconds) Ownable() {}

    function payout(address token) public onlyOwner {
        ERC20 _token = ERC20(token);
        require(_token.balanceOf(address(this)) > 0, "BrainVestingWallet: insufficient balance for payout");
        _token.transfer(owner(), _token.balanceOf(address(this)));
    }
}