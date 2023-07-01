// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";

interface IERC721Value is IERC721 {
    function tokenValue(uint256 tokenId) external view returns (uint256);
}

abstract contract ERC721Value is IERC4906, ERC721, IERC721Value {

    // Optional mapping for token values
    mapping(uint256 => uint256) private _tokenValues;

    function tokenValue(uint256 tokenId) public view virtual returns (uint256) {
        _requireMinted(tokenId);
        return _tokenValues[tokenId];
    }

    function _setTokenValue(uint256 tokenId, uint256 _tokenValue) internal virtual {
        require(_exists(tokenId), "ERC721Value: value set of nonexistent token");
        _tokenValues[tokenId] = _tokenValue;

        emit MetadataUpdate(tokenId);
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC721Value).interfaceId || super.supportsInterface(interfaceId);
    }
}