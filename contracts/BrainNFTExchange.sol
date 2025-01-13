// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BrainsNFT.sol";

/**
 * @title BrainsExchange
 * @notice Users can burn their BrainsNFT in exchange for a certain amount of $BRAINS tokens.
 *         Make sure this contract has enough $BRAINS balance before exchanging.
 */
contract BrainsExchange is Ownable {
    BrainsNFT public immutable brainsNFT;
    IERC20 public immutable brainsToken;

    /**
     * @dev The constructor sets the references to the NFT and $BRAINS token contracts.
     * @param _brainsNFT Address of the deployed BrainsNFT contract.
     * @param _brainsToken Address of the ERC20 $BRAINS token contract.
     */
    constructor(address _brainsNFT, address _brainsToken) {
        require(_brainsNFT != address(0) && _brainsToken != address(0), "Invalid addresses");
        brainsNFT = BrainsNFT(_brainsNFT);
        brainsToken = IERC20(_brainsToken);
    }

    /**
     * @notice Burn the NFT in exchange for $BRAINS tokens.
     * @dev The caller must own the NFT, and the NFT must have a value > 0.
     * @param tokenId The ID of the NFT to be burned.
     */
    function exchange(uint256 tokenId) external {
        require(brainsNFT.ownerOf(tokenId) == _msgSender(), "Not the owner of this NFT");
        uint256 tokenValue = brainsNFT.tokenValue(tokenId);
        require(tokenValue > 0, "NFT value must be greater than zero");
        require(brainsToken.balanceOf(address(this)) >= tokenValue, "Insufficient $BRAINS in contract");

        // Burn the NFT
        brainsNFT.burn(tokenId);

        // Transfer $BRAINS to the user
        bool success = brainsToken.transfer(_msgSender(), tokenValue);
        require(success, "Token transfer failed");
    }

    /**
     * @notice Owner can deposit tokens to this contract so users can exchange their NFTs.
     * @param amount The amount of $BRAINS tokens to deposit.
     */
    function depositTokens(uint256 amount) external onlyOwner {
        bool success = brainsToken.transferFrom(_msgSender(), address(this), amount);
        require(success, "Deposit failed");
    }

    /**
     * @notice Owner can withdraw any remaining tokens from this contract.
     * @param amount The amount of $BRAINS tokens to withdraw.
     */
    function withdrawTokens(uint256 amount) external onlyOwner {
        bool success = brainsToken.transfer(_msgSender(), amount);
        require(success, "Withdrawal failed");
    }
}
