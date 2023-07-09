// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";

interface IERC721Exchangable is IERC721 {
    function exchangeToken() external view returns (address);
}

abstract contract ERC721Exchangable is IERC4906, ERC721, IERC721Exchangable {

    address private _exchangeTokenAddress;

    event TokensExchanged(uint256 _tokenId);
    event ExchangeEnabled();
    event ExchangeDisabled();

    modifier whenExchangeEnabled() {
        require(_exchangeTokenAddress != address(0), "ERC721Exchangable: exchange is not enabled");
        _;
    }

    function exchangeToken() public view returns (address) {
        return _exchangeTokenAddress;
    }

    function _enableExchange(address exchangeTokenAddress) internal virtual {
        require(exchangeTokenAddress != address(0), "ERC721Exchangable: exchange token address is the zero address");
        _exchangeTokenAddress = exchangeTokenAddress;
        emit ExchangeEnabled();
    }

    function _disableExchange() internal virtual {
        _exchangeTokenAddress = address(0);
        emit ExchangeDisabled();
    }

    function _exchange(uint256 tokenId, uint256 tokenAmount) internal virtual {
        _requireMinted(tokenId);
        require(_msgSender() == ownerOf(tokenId), "ERC721Exchangable: caller is not the owner");
        require(tokenAmount > 0, "ERC721Exchangable: token amount must be greater than zero");
        ERC20 token = ERC20(_exchangeTokenAddress);
        require(token.balanceOf(address(this)) >= tokenAmount, "ERC721Exchangable: insufficient balance for exchange");
        _burn(tokenId);
        token.transfer(_msgSender(), tokenAmount);
        emit TokensExchanged(tokenId);
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC721Exchangable).interfaceId || super.supportsInterface(interfaceId);
    }
}