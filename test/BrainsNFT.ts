import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

describe("BrainsNFT", function () {
  async function deploy() {
    const [owner, otherAccount] = await ethers.getSigners();

    const BrainsNFT = await ethers.getContractFactory("BrainsNFT");
    const contract = await BrainsNFT.deploy();

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const erc20Contract = await ERC20Mock.deploy('BRAINS', 'BRAINS');

    const tx = await contract.safeMint(owner.address, "reward.png", 12);
    const receipt = await tx.wait();
    const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;

    return { contract, owner, otherAccount, tokenId, erc20Contract };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { contract, owner } = await loadFixture(deploy);

      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should set the right name", async function () {
      const { contract } = await loadFixture(deploy);

      expect(await contract.name()).to.equal("$NEURON");
    });

    it("Should set the right symbol", async function () {
      const { contract } = await loadFixture(deploy);

      expect(await contract.symbol()).to.equal("NEURON");
    });
  });

  describe("Mint", function () {
    it("Should mint a token with proper owner", async function () {
      const { contract, owner, tokenId } = await loadFixture(deploy);

      expect(await contract.ownerOf(tokenId)).to.equal(owner.address);
      expect(await contract.balanceOf(owner.address)).to.equal(1);
    });

    it("Should mint a token with proper URI", async function () {
      const { contract, tokenId } = await loadFixture(deploy);

      expect(await contract.tokenURI(tokenId)).to.equal("reward.png");
    });

    it("Should mint a token with proper reward", async function () {
      const { contract, tokenId } = await loadFixture(deploy);

      expect(await contract.tokenValue(tokenId)).to.equal(12);
    });

    it("Should mint a token incremented id", async function () {
      const { contract, owner, tokenId } = await loadFixture(deploy);

      const tx = await contract.safeMint(owner.address, "reward.png", 12);
      const receipt = await tx.wait();
      const anotherTokenId: BigNumber = (receipt.events?.[0] as any).args
        .tokenId;

      expect(anotherTokenId).to.be.greaterThan(tokenId);
    });

    it("Should fail if access value of non-existing token", async function () {
      const { contract } = await loadFixture(deploy);

      await expect(contract.tokenValue(123)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
    });

    it("Should fail if access uri of non-existing token", async function () {
      const { contract } = await loadFixture(deploy);

      await expect(contract.tokenURI(123)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
    });
  });

  describe("Batch Mint", function () {
    it("Should mint a batch of tokens with proper owner", async function () {
      const { contract, owner, otherAccount } = await loadFixture(deploy);

      const tx = await contract.safeBatchMint(
        [owner.address, owner.address, otherAccount.address],
        ["reward.png", "reward2.png", "reward3.png"],
        [11, 12, 13]
      );
      await tx.wait();

      expect(await contract.ownerOf(1)).to.equal(owner.address);
      expect(await contract.ownerOf(2)).to.equal(owner.address);
      expect(await contract.ownerOf(3)).to.equal(otherAccount.address);
      expect(await contract.balanceOf(owner.address)).to.equal(3);
      expect(await contract.balanceOf(otherAccount.address)).to.equal(1);
    });

    it("Should mint a batch of tokens with proper owner", async function () {
      const { contract, owner } = await loadFixture(deploy);

      const tx = await contract.safeBatchMint(
        [owner.address, owner.address],
        ["reward.png", "reward2.png"],
        [11, 12]
      );
      await tx.wait();

      expect(await contract.tokenURI(1)).to.equal("reward.png");
      expect(await contract.tokenURI(2)).to.equal("reward2.png");
    });

    it("Should mint a batch of tokens with proper reward", async function () {
      const { contract, owner } = await loadFixture(deploy);

      const tx = await contract.safeBatchMint(
        [owner.address, owner.address],
        ["reward.png", "reward2.png"],
        [11, 12]
      );
      await tx.wait();

      expect(await contract.tokenValue(1)).to.equal(11);
      expect(await contract.tokenValue(2)).to.equal(12);
    });

    it("Should fail if batch minting with different array lengths", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(
        contract.safeBatchMint(
          [owner.address, owner.address],
          ["reward.png"],
          [11, 12]
        )
      ).to.be.revertedWith("BrainsNFT: array length mismatch");

      await expect(
        contract.safeBatchMint(
          [owner.address],
          ["reward.png", "reward2.png"],
          [11, 12]
        )
      ).to.be.revertedWith("BrainsNFT: array length mismatch");

      await expect(
        contract.safeBatchMint(
          [owner.address, owner.address],
          ["reward.png", "reward2.png"],
          [11]
        )
      ).to.be.revertedWith("BrainsNFT: array length mismatch");
    });

    it("Should fail if batch minting with zero length arrays", async function () {
      const { contract } = await loadFixture(deploy);

      await expect(contract.safeBatchMint([], [], [])).to.be.revertedWith(
        "BrainsNFT: array length mismatch"
      );
    });

    it("Should fail batch minting if not owner", async function () {
      const { contract, otherAccount } = await loadFixture(deploy);

      await expect(
        contract
          .connect(otherAccount)
          .safeBatchMint(
            [otherAccount.address, otherAccount.address],
            ["reward.png", "reward2.png"],
            [11, 12]
          )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Transfer", function () {
    it("Should transfer a token with proper owner", async function () {
      const { contract, owner, tokenId, otherAccount } = await loadFixture(
        deploy
      );

      await contract.transferFrom(owner.address, otherAccount.address, tokenId);

      expect(await contract.ownerOf(tokenId)).to.equal(otherAccount.address);
      expect(await contract.balanceOf(otherAccount.address)).to.equal(1);
    });

    it("Should not transfer a token if not an owner", async function () {
      const { contract, owner, tokenId, otherAccount } = await loadFixture(
        deploy
      );

      await expect(
        contract.transferFrom(otherAccount.address, owner.address, tokenId)
      ).to.be.revertedWith("ERC721: transfer from incorrect owner");
    });

    it("Should transfer token if approved", async function () {
      const { contract, owner, tokenId, otherAccount } = await loadFixture(
        deploy
      );

      await contract.approve(otherAccount.address, tokenId);
      await contract
        .connect(otherAccount)
        .transferFrom(owner.address, otherAccount.address, tokenId, {
          from: otherAccount.address,
        });

      expect(await contract.ownerOf(tokenId)).to.equal(otherAccount.address);
      expect(await contract.balanceOf(otherAccount.address)).to.equal(1);
    });
  });

  describe("Burn", function () {
    it("Should burn a token", async function () {
      const { contract, owner, tokenId } = await loadFixture(deploy);

      await contract.burn(tokenId);

      await expect(contract.ownerOf(tokenId)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
      expect(await contract.balanceOf(owner.address)).to.equal(0);
    });

    it("Should not burn a token if not an owner", async function () {
      const { contract, owner, tokenId, otherAccount } = await loadFixture(
        deploy
      );

      await expect(
        contract.connect(otherAccount).burn(tokenId)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });

    it("Should burn token if approved", async function () {
      const { contract, owner, tokenId, otherAccount } = await loadFixture(
        deploy
      );

      await contract.approve(otherAccount.address, tokenId);
      await contract.connect(otherAccount).burn(tokenId);

      await expect(contract.ownerOf(tokenId)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
      expect(await contract.balanceOf(owner.address)).to.equal(0);
    });

    it("Should fail burn if token does not exist", async function () {
      const { contract } = await loadFixture(deploy);

      await expect(contract.burn(123)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
    });
  });

  describe("Value", function () {
    it("Should set token value if owner", async function () {
      const { contract, tokenId } = await loadFixture(deploy);

      const tx = await contract.setTokenValue(tokenId, 123);
      await tx.wait();

      expect(await contract.tokenValue(tokenId)).to.equal(123);
    });

    it("Should fail setting token value if not an owner", async function () {
      const { contract, tokenId, otherAccount } = await loadFixture(deploy);

      await expect(
        contract.connect(otherAccount).setTokenValue(tokenId, 123)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail setting token value if token does not exist", async function () {
      const { contract } = await loadFixture(deploy);

      await expect(contract.setTokenValue(123, 123)).to.be.revertedWith(
        "ERC721Value: value set of nonexistent token"
      );
    });
  });

  describe("Token URI", function () {
    it("Should set token URI if owner", async function () {
      const { contract, tokenId } = await loadFixture(deploy);

      const tx = await contract.setTokenURI(tokenId, "newReard.png");
      await tx.wait();

      expect(await contract.tokenURI(tokenId)).to.equal("newReard.png");
    });

    it("Should fail setting token URI if not an owner", async function () {
      const { contract, tokenId, otherAccount } = await loadFixture(deploy);

      await expect(
        contract.connect(otherAccount).setTokenURI(tokenId, "newReard.png")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Pausable", async function () {
    it("should pause if owner", async function () {
      const { contract } = await loadFixture(deploy);

      await contract.pause();

      expect(await contract.paused()).to.equal(true);
    });

    it("should unpause if owner", async function () {
      const { contract } = await loadFixture(deploy);

      await contract.pause();
      await contract.unpause();

      expect(await contract.paused()).to.equal(false);
    });

    it("should fail pause if already paused", async function () {
      const { contract } = await loadFixture(deploy);

      await contract.pause();

      expect(await contract.paused()).to.equal(true);

      await expect(contract.pause()).to.be.revertedWith("Pausable: paused");
    });

    it("should fail unpause if not paused", async function () {
      const { contract } = await loadFixture(deploy);

      expect(await contract.paused()).to.equal(false);

      await expect(contract.unpause()).to.be.revertedWith(
        "Pausable: not paused"
      );
    });

    it("should fail pause if not owner", async function () {
      const { contract, otherAccount } = await loadFixture(deploy);

      await expect(contract.connect(otherAccount).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should fail unpause if not owner", async function () {
      const { contract, otherAccount } = await loadFixture(deploy);

      await contract.pause();
      expect(await contract.paused()).to.equal(true);

      await expect(contract.connect(otherAccount).unpause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Exchange", function () {
    it("Should exchange tokens", async function () {
      const { contract, owner, otherAccount, erc20Contract } =
        await loadFixture(deploy);

      await erc20Contract.mint(owner.address, 1000);
      await erc20Contract.transfer(contract.address, 1000);
      console.log("ERC20 tokens minted and transfered");

      const mintTx = await contract.safeMint(
        otherAccount.address,
        "reward1000.png",
        1000
      );
      const receipt = await mintTx.wait();
      const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;
      console.log("New NFT was minted");

      await contract.enableExchange(erc20Contract.address);
      console.log("Exchange enabled");

      const tx = await contract.connect(otherAccount).exchange(tokenId);
      await tx.wait();
      console.log("Exchanged");

      await expect(contract.ownerOf(tokenId)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
      expect(await erc20Contract.balanceOf(otherAccount.address)).to.equal(
        1000
      );
    });

    it("Should fail exchange if not enabled", async function () {
      const { contract, owner, otherAccount, erc20Contract } =
        await loadFixture(deploy);

      await erc20Contract.mint(owner.address, 1000);
      await erc20Contract.transfer(contract.address, 1000);

      const mintTx = await contract.safeMint(
        otherAccount.address,
        "reward1000.png",
        1000
      );
      const receipt = await mintTx.wait();
      const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;

      await expect(
        contract.connect(otherAccount).exchange(tokenId)
      ).to.be.revertedWith("ERC721Exchangable: exchange is not enabled");
    });

    it("Should fail exchange if not owner", async function () {
      const { contract, owner, otherAccount, erc20Contract } =
        await loadFixture(deploy);

      await erc20Contract.mint(owner.address, 1000);
      await erc20Contract.transfer(contract.address, 1000);

      const mintTx = await contract.safeMint(
        otherAccount.address,
        "reward1000.png",
        1000
      );
      const receipt = await mintTx.wait();
      const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;

      await contract.enableExchange(erc20Contract.address);

      await expect(
        contract.connect(owner).exchange(tokenId)
      ).to.be.revertedWith("ERC721Exchangable: caller is not the owner");
    });

    it("Should fail exchange if not enough tokens", async function () {
      const { contract, owner, otherAccount, erc20Contract } =
        await loadFixture(deploy);

      await erc20Contract.mint(owner.address, 1000);
      await erc20Contract.transfer(contract.address, 800);

      const mintTx = await contract.safeMint(
        otherAccount.address,
        "reward1000.png",
        1000
      );
      const receipt = await mintTx.wait();
      const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;

      await contract.enableExchange(erc20Contract.address);

      await expect(
        contract.connect(otherAccount).exchange(tokenId)
      ).to.be.revertedWith(
        "ERC721Exchangable: insufficient balance for exchange"
      );
    });

    it("Should fail exchange if zero tokens", async function () {
      const { contract, owner, otherAccount, erc20Contract } =
        await loadFixture(deploy);

      await erc20Contract.mint(owner.address, 1000);
      await erc20Contract.transfer(contract.address, 800);

      const mintTx = await contract.safeMint(
        otherAccount.address,
        "reward1000.png",
        0
      );
      const receipt = await mintTx.wait();
      const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;

      await contract.enableExchange(erc20Contract.address);

      await expect(
        contract.connect(otherAccount).exchange(tokenId)
      ).to.be.revertedWith(
        "ERC721Exchangable: token amount must be greater than zero"
      );
    });

    it("Should fail exchange if not minted", async function () {
      const { contract, owner, otherAccount, erc20Contract } =
        await loadFixture(deploy);

      await erc20Contract.mint(owner.address, 1000);
      await erc20Contract.transfer(contract.address, 1000);

      await contract.enableExchange(erc20Contract.address);

      await expect(
        contract.connect(otherAccount).exchange(0)
      ).to.be.revertedWith("ERC721Exchangable: caller is not the owner");
    });

    it("Should disable exchange", async function () {
      const { contract, owner, otherAccount, erc20Contract } =
        await loadFixture(deploy);

      await erc20Contract.mint(owner.address, 1000);
      await erc20Contract.transfer(contract.address, 1000);

      const mintTx = await contract.safeMint(
        otherAccount.address,
        "reward1000.png",
        1000
      );
      const receipt = await mintTx.wait();
      const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;

      await contract.enableExchange(erc20Contract.address);

      contract.connect(otherAccount).exchange(tokenId);

      await contract.disableExchange();

      expect(await contract.exchangeToken()).to.equal(
        ethers.constants.AddressZero
      );

      await expect(
        contract.connect(otherAccount).exchange(tokenId)
      ).to.be.revertedWith("ERC721Exchangable: exchange is not enabled");
    });

    it("Should fail disable exchange if not owner", async function () {
      const { contract, otherAccount } = await loadFixture(deploy);

      await expect(
        contract.connect(otherAccount).disableExchange()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail enable exchange if not owner", async function () {
      const { contract, owner, otherAccount, erc20Contract } =
        await loadFixture(deploy);

      await erc20Contract.mint(owner.address, 1000);
      await erc20Contract.transfer(contract.address, 1000);

      await expect(
        contract.connect(otherAccount).enableExchange(erc20Contract.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail enable exchange if zero address", async function () {
      const { contract, owner } = await loadFixture(deploy);

      await expect(
        contract.connect(owner).enableExchange(ethers.constants.AddressZero)
      ).to.be.revertedWith(
        "ERC721Exchangable: exchange token address is the zero address"
      );
    });

    it("Should change exchange token even if already enabled", async function () {
      const { contract, owner, erc20Contract } = await loadFixture(deploy);

      await erc20Contract.mint(owner.address, 1000);
      await erc20Contract.transfer(contract.address, 1000);

      await contract.enableExchange(erc20Contract.address);
      expect(await contract.exchangeToken()).to.equal(erc20Contract.address);

      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      const erc20Contract2 = await ERC20Mock.deploy('BRAINS', 'BRAINS');

      await contract.enableExchange(erc20Contract2.address);
      expect(await contract.exchangeToken()).to.equal(erc20Contract2.address);
    });

    it("Should fail exchange tokens if paused", async function () {
      const { contract, owner, otherAccount, erc20Contract } =
        await loadFixture(deploy);

      await erc20Contract.mint(owner.address, 1000);
      await erc20Contract.transfer(contract.address, 1000);

      const mintTx = await contract.safeMint(
        otherAccount.address,
        "reward1000.png",
        1000
      );
      const receipt = await mintTx.wait();
      const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;

      await contract.enableExchange(erc20Contract.address);

      await contract.pause();

      await expect(
        contract.connect(otherAccount).exchange(tokenId)
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
