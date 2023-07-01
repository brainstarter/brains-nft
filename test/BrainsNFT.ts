import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

describe("BrainsNFT", function () {
  async function deploy() {
    const [owner, otherAccount] = await ethers.getSigners();

    const BrainsNFT = await ethers.getContractFactory("BrainsNFT");
    const contract = await BrainsNFT.deploy();

    const tx = await contract.safeMint(owner.address, 'reward.png', 12);
    const receipt = await tx.wait();
    const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;

    return { contract, owner, otherAccount, tokenId };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { contract, owner } = await loadFixture(deploy);

      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should set the right name", async function () {
        const { contract } = await loadFixture(deploy);
    
        expect(await contract.name()).to.equal("$BRAINSNFT");
    });

    it("Should set the right symbol", async function () {
        const { contract } = await loadFixture(deploy);
    
        expect(await contract.symbol()).to.equal("BRNFT");
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
       
        expect(await contract.tokenURI(tokenId)).to.equal('reward.png');
    });

    it("Should mint a token with proper reward", async function () {
        const { contract, tokenId } = await loadFixture(deploy);

        expect(await contract.tokenValue(tokenId)).to.equal(12);
    });

    it("Should mint a token incremented id", async function () {
        const { contract, owner, tokenId } = await loadFixture(deploy);

        const tx = await contract.safeMint(owner.address, 'reward.png', 12);
        const receipt = await tx.wait();
        const anotherTokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;

        expect(anotherTokenId).to.be.greaterThan(tokenId);
    });

    it("Should fail if access value of non-existing token", async function () {
        const { contract } = await loadFixture(deploy);

        await expect(contract.tokenValue(123)).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Should fail if access uri of non-existing token", async function () {
        const { contract } = await loadFixture(deploy);

        await expect(contract.tokenURI(123)).to.be.revertedWith("ERC721: invalid token ID");
    });
  });

    describe("Transfer", function () {
        
        it("Should transfer a token with proper owner", async function () {
            const { contract, owner, tokenId, otherAccount } = await loadFixture(deploy);

            await contract.transferFrom(owner.address, otherAccount.address, tokenId);

            expect(await contract.ownerOf(tokenId)).to.equal(otherAccount.address);
            expect(await contract.balanceOf(otherAccount.address)).to.equal(1);
        });

        it("Should not transfer a token if not an owner", async function () {
            const { contract, owner, tokenId, otherAccount } = await loadFixture(deploy);
           
            await expect(contract.transferFrom(otherAccount.address, owner.address, tokenId)).to.be.revertedWith("ERC721: transfer from incorrect owner");
        });

        it("Should transfer token if approved", async function () {
            const { contract, owner, tokenId, otherAccount } = await loadFixture(deploy);

            await contract.approve(otherAccount.address, tokenId);
            await contract.connect(otherAccount).transferFrom(owner.address, otherAccount.address, tokenId, { from: otherAccount.address });

            expect(await contract.ownerOf(tokenId)).to.equal(otherAccount.address);
            expect(await contract.balanceOf(otherAccount.address)).to.equal(1);
        });
    });

    describe("Burn", function () {
            
        it("Should burn a token", async function () {
            const { contract, owner, tokenId } = await loadFixture(deploy);

            await contract.burn(tokenId);

            await expect(contract.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
            expect(await contract.balanceOf(owner.address)).to.equal(0);
        });

        it("Should not burn a token if not an owner", async function () {
            const { contract, owner, tokenId, otherAccount } = await loadFixture(deploy);
        
            await expect(contract.connect(otherAccount).burn(tokenId)).to.be.revertedWith("ERC721: caller is not token owner or approved");
        });

        it("Should burn token if approved", async function () {
            const { contract, owner, tokenId, otherAccount } = await loadFixture(deploy);

            await contract.approve(otherAccount.address, tokenId);
            await contract.connect(otherAccount).burn(tokenId);

            await expect(contract.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
            expect(await contract.balanceOf(owner.address)).to.equal(0);
        });

        it("Should fail burn if token does not exist", async function () {
            const { contract } = await loadFixture(deploy);

            await expect(contract.burn(123)).to.be.revertedWith("ERC721: invalid token ID");
        });
    });
});
