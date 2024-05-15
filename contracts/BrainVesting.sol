// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/finance/VestingWallet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./BrainsNFT.sol";
import "./BrainVestingWallet.sol";

contract BrainVesting is Ownable {
    mapping(address => BrainVestingWallet[]) private _wallets;
    BrainsNFT private _nft;
    ERC20 private _token;
    uint64 constant public COMMON_YEAR_SECONDS = 49852800;
    uint64 constant public VESTING_START_DATE = 1715817600;

    constructor(address nft, address token) Ownable() {
        _nft = BrainsNFT(nft);
        _token = ERC20(token);
    }

    function exchange(uint256 tokenId) public {
        address nftOwner = _nft.ownerOf(tokenId);
        require(nftOwner == _msgSender(), "BrainVesting: caller is not the owner of the NFT");

        uint256 tokenValue = _nft.tokenValue(tokenId);
        require(tokenValue > 0, "BrainVesting: token value must be greater than zero");
        require(_token.balanceOf(address(this)) >= tokenValue, "BrainVesting: insufficient balance for exchange");

        _nft.burn(tokenId);

        uint256 ownerReward = tokenValue / 20; // 5% of tokenValue
        uint256 vestingAmount = tokenValue - ownerReward; // 95% of tokenValue
        
        _token.transfer(nftOwner, ownerReward);

        BrainVestingWallet wallet = new BrainVestingWallet(_msgSender(), VESTING_START_DATE, COMMON_YEAR_SECONDS, owner());
        _token.transfer(address(wallet), vestingAmount);
        _wallets[_msgSender()].push(wallet);
    }

    function vestings(address account) public view returns (BrainVestingWallet[] memory) {
        return _wallets[account];
    }

    function payout() public onlyOwner {
        require(_token.balanceOf(address(this)) > 0, "BrainVesting: insufficient balance for payout");
        _token.transfer(owner(), _token.balanceOf(address(this)));
    }
}