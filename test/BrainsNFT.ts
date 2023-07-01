import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

describe("BrainsNFT", function () {
  async function deploy() {
    const [owner] = await ethers.getSigners();

    const BrainsNFT = await ethers.getContractFactory("BrainsNFT");
    const contract = await BrainsNFT.deploy();

    return { contract, owner };
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
        const { contract, owner } = await loadFixture(deploy);
       
        const tx = await contract.safeMint(owner.address, 'reward.png', 12);
        const receipt = await tx.wait();
        const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;

        expect(await contract.ownerOf(tokenId)).to.equal(owner.address);
    });

    it("Should mint a token with proper URI", async function () {
        const { contract, owner } = await loadFixture(deploy);
       
        const tx = await contract.safeMint(owner.address, 'reward.png', 12);
        const receipt = await tx.wait();
        const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;

        expect(await contract.tokenURI(tokenId)).to.equal('reward.png');
    });

    it("Should mint a token with proper reward", async function () {
        const { contract, owner } = await loadFixture(deploy);
       
        const tx = await contract.safeMint(owner.address, 'reward.png', 12);
        const receipt = await tx.wait();
        const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;

        expect(await contract.tokenValue(tokenId)).to.equal(12);
    });

  })
});
