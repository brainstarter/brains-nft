// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./BrainsNFT.sol";

contract BrainNFTSale is Ownable, IERC721Receiver {
    BrainsNFT public brainsNFT;
    IERC20 public usdc;
    IERC20 public usdt;

    uint256[] private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;

    address public recipient;
    uint256 public basePrice; // Price in stablecoins for 1 $BRAINS

    constructor(
        address _brainsNFT,
        address _usdc,
        address _usdt,
        address _recipient,
        uint256 _basePrice
    ) {
        brainsNFT = BrainsNFT(_brainsNFT);
        usdc = IERC20(_usdc);
        usdt = IERC20(_usdt);
        recipient = _recipient;
        basePrice = _basePrice;
    }

    function setBasePrice(uint256 _basePrice) external onlyOwner {
        basePrice = _basePrice;
    }

    function setRecipient(address _recipient) external onlyOwner {
        recipient = _recipient;
    }

    function setStableCoins(address _usdc, address _usdt) external onlyOwner {
        usdc = IERC20(_usdc);
        usdt = IERC20(_usdt);
    }

    function buy(uint256 tokenId, address stablecoinAddress) external {
        // Calculate cost = tokenValue * basePrice
        uint256 tokenValue = brainsNFT.tokenValue(tokenId);
        uint256 cost = (tokenValue * basePrice) / 1e18;

        if (recipient == address(0)) {
            revert("Recipient not set");
        }

        if (cost == 0) {
            revert("Invalid token value");
        }

        // Check if the stablecoin is supported
        if (
            stablecoinAddress != address(usdc) &&
            stablecoinAddress != address(usdt)
        ) {
            revert("Unsupported stablecoin");
        }

        // Handle payment
        IERC20 stableCoin = IERC20(stablecoinAddress);
        require(
            stableCoin.allowance(_msgSender(), address(this)) >= cost,
            "Insufficient allowance"
        );
        require(
            stableCoin.transferFrom(_msgSender(), recipient, cost),
            "Payment failed"
        );

        // Transfer NFT to buyer
        // Owner of BrainsNFT must have approved this contract to transfer the NFT if it's already minted,
        // or the NFT can be minted directly to this contract and then transferred out.
        brainsNFT.safeTransferFrom(
            brainsNFT.ownerOf(tokenId),
            _msgSender(),
            tokenId
        );

        _removeTokenFromInventory(tokenId);
    }

    function withdrawAllNFTs(address _to) external onlyOwner {
        uint256 balance = brainsNFT.balanceOf(address(this));
        for (uint256 i = 0; i < balance; i++) {
            // Always take index 0 after each transfer, because indexes shift.
            uint256 tokenId = brainsNFT.tokenOfOwnerByIndex(address(this), 0);
            brainsNFT.safeTransferFrom(address(this), _to, tokenId);
        }
    }

    function _addTokenToInventory(uint256 tokenId) internal {
        _ownedTokensIndex[tokenId] = _ownedTokens.length;
        _ownedTokens.push(tokenId);
    }

    function _removeTokenFromInventory(uint256 tokenId) internal {
        uint256 lastTokenIndex = _ownedTokens.length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];
        
        uint256 lastTokenId = _ownedTokens[lastTokenIndex];
        _ownedTokens[tokenIndex] = lastTokenId;
        _ownedTokensIndex[lastTokenId] = tokenIndex;

        _ownedTokens.pop();
        delete _ownedTokensIndex[tokenId];
    }

    function getOwnedTokens() external view returns (uint256[] memory) {
        return _ownedTokens;
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
         _addTokenToInventory(tokenId);
        return this.onERC721Received.selector;
    }
}
