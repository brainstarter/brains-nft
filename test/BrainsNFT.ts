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

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const erc20Contract = await ERC20Mock.deploy();

    const tx = await contract.safeMint(owner.address, 'reward.png', 12);
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

    describe("Value", function () {

        it("Should set token value if owner", async function () {
            const { contract, tokenId } = await loadFixture(deploy);

            const tx = await contract.setTokenValue(tokenId, 123);
            await tx.wait();

            expect(await contract.tokenValue(tokenId)).to.equal(123);
        });

        it("Should fail setting token value if not an owner", async function () {
            const { contract, tokenId, otherAccount } = await loadFixture(deploy);

            await expect(contract.connect(otherAccount).setTokenValue(tokenId, 123)).to.be.revertedWith("Ownable: caller is not the owner");
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

            await expect(contract.connect(otherAccount).setTokenURI(tokenId, "newReard.png")).to.be.revertedWith("Ownable: caller is not the owner");
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

            await expect(contract.unpause()).to.be.revertedWith("Pausable: not paused");
        });

        it("should fail pause if not owner", async function () {
            const { contract, otherAccount } = await loadFixture(deploy);

            await expect(contract.connect(otherAccount).pause()).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should fail unpause if not owner", async function () {
            const { contract, otherAccount } = await loadFixture(deploy);

            await contract.pause();
            expect(await contract.paused()).to.equal(true);

            await expect(contract.connect(otherAccount).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
        });
    })

    // describe("Exchange", function () {

    //     it("Should exchange tokens", async function () {
    //         const { contract, owner, otherAccount, erc20Contract } = await loadFixture(deploy);

    //         await erc20Contract.mint(owner.address, 1000);
    //         await erc20Contract.transfer(contract.address, 1000);
    //         console.log("ERC20 tokens minted and transfered");

    //         const mintTx = await contract.safeMint(otherAccount.address, "reward1000.png", 1000);
    //         const receipt = await mintTx.wait();
    //         const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;
    //         console.log("New NFT was minted");

    //         await contract.enableExchange(erc20Contract.address);
    //         console.log("Exchange enabled");

    //         const tx = await contract.connect(otherAccount.address).exchange(tokenId);
    //         await tx.wait();
    //         console.log("Exchanged");

    //         expect(await contract.ownerOf(tokenId)).to.equal(0);
    //         expect(await erc20Contract.balanceOf(otherAccount.address)).to.equal(1000);
    //     });

    // });
});
