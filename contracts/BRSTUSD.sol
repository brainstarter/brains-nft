// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { DropERC20 } from '@thirdweb-dev/contracts/prebuilts/drop/DropERC20.sol';
import { IDrop } from '@thirdweb-dev/contracts/extension/interface/IDrop.sol';
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract MetaUSDT is ReentrancyGuard, Ownable, ERC20, ERC20Permit, ERC20Burnable {
    IERC20 public usdt;
    IERC20 public usdc;
    DropERC20 public tokenDrop;
    address private saleReceiver;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable() ERC20Permit(name) {}

    function initialize(address _usdt, address _usdc, address _tokenDrop, address _receiver) external onlyOwner {
        usdt = IERC20(_usdt);
        usdc = IERC20(_usdc);
        saleReceiver = _receiver;
        tokenDrop = DropERC20(_tokenDrop);
    }

    function setReceiver(address _receiver) external onlyOwner {
        saleReceiver = _receiver;
    }

    function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, IDrop.AllowlistProof calldata _allowlistProof, bytes memory _data) external nonReentrant {
        require(_currency == address(usdt) || _currency == address(usdc), "Invalid currency token");
        require(_quantity > 0, "Invalid quantity");
        require(_pricePerToken > 0, "Invalid price per token");
        require(_receiver != address(0), "Invalid receiver");

        // convert desired quanity to amount of stablecoins to pay
        uint256 stablecoinAmount = _quantity * _pricePerToken / 1 ether;

        require(stablecoinAmount > 0, "Invalid quantity");

        // transfer real stablecoin to sale receiver
        IERC20(_currency).transferFrom(_msgSender(), saleReceiver, stablecoinAmount);

        // mint meta stablecoin
        _mint(address(this), stablecoinAmount);
        // approve meta stablecoin to token drop
        _approve(address(this), address(tokenDrop), stablecoinAmount);

        // initiate original claim
        tokenDrop.claim(_receiver, _quantity, address(this), _pricePerToken, _allowlistProof, _data);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}