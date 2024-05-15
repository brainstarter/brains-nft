import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const EMPTY_MERKLE_ROOT = "0x0000000000000000000000000000000000000000000000000000000000000000";

const DEFAULT_CLAIM_CONDITION = (usdcAddress: string, timestamp: number) => ({
    currency: usdcAddress,
    maxClaimableSupply: ethers.utils.parseEther("1500"),
    pricePerToken: ethers.utils.parseEther("0.1"),
    quantityLimitPerWallet: ethers.utils.parseEther("10"),
    startTimestamp: timestamp,
    supplyClaimed: 0,
    merkleRoot: EMPTY_MERKLE_ROOT,
    metadata: ''
});


describe("BrainsSale", function () {
    async function deploy() {
      const [owner, otherAccount] = await ethers.getSigners();
  
      const BrainsSale = await ethers.getContractFactory("BrainsSale");
      const contract = await BrainsSale.deploy(owner.address, "$BRAINS_SALES", "$BS", owner.address);

      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      const usdc = await ERC20Mock.deploy('BRAINS', 'BRAINS');
      await usdc.mint(owner.address, ethers.utils.parseEther("1000000000000000000000000000"));

      const timestamp = await time.latest();
  
      return { contract, owner, otherAccount, usdc, timestamp };
    }

    describe("Deployment", () => {
        it('should have proper symbol', async () => {
            const { contract } = await loadFixture(deploy);
    
            expect(await contract.symbol()).to.equal("$BS");
        });
    
        it('should have proper name', async () => {
            const { contract } = await loadFixture(deploy);
    
            expect(await contract.name()).to.equal("$BRAINS_SALES");
        });
    
        it('should have 0 totalSupply', async () => {
            const { contract } = await loadFixture(deploy);
    
            expect(await contract.totalSupply()).to.equal(0);
        });
    
        it('should have 0 balance', async () => {
            const { contract, otherAccount } = await loadFixture(deploy);
    
            expect(await contract.balanceOf(otherAccount.address)).to.equal(0);
        });
    
        it('should have 18 decimals', async () => {
            const { contract } = await loadFixture(deploy);
    
            expect(await contract.decimals()).to.equal(18);
        });
    
        it('should have proper owner', async () => {
            const { contract, owner } = await loadFixture(deploy);
    
            expect(await contract.owner()).to.equal(owner.address);
        });
    
        it('should have primary recipient', async () => {
            const { contract, owner } = await loadFixture(deploy);
    
            expect(await contract.primarySaleRecipient()).to.equal(owner.address);
        });

        it('should have empty contractURI', async () => {
            const { contract } = await loadFixture(deploy);
    
            expect(await contract.contractURI()).to.equal("");
        });
    });

    describe('Recipient', () => {
        it('should be able to set primary recipient', async () => {
            const { contract, owner, otherAccount } = await loadFixture(deploy);
    
            await contract.connect(owner).setPrimarySaleRecipient(otherAccount.address);
    
            expect(await contract.primarySaleRecipient()).to.equal(otherAccount.address);
        });
    
        it('should not be able to set primary recipient by non-owner', async () => {
            const { contract, otherAccount } = await loadFixture(deploy);
    
            await expect(contract.connect(otherAccount).setPrimarySaleRecipient(otherAccount.address)).to.be.revertedWith("Not authorized");
        });
    });

    describe('Owner', () => {
        it('should be able to set owner', async () => {
            const { contract, owner, otherAccount } = await loadFixture(deploy);
    
            await contract.connect(owner).setOwner(otherAccount.address);
    
            expect(await contract.owner()).to.equal(otherAccount.address);
        });
    
        it('should not be able to set owner by non-owner', async () => {
            const { contract, otherAccount } = await loadFixture(deploy);
    
            await expect(contract.connect(otherAccount).setOwner(otherAccount.address)).to.be.revertedWith("Not authorized");
        });
    });

    describe('Transfer', () => {
        // it('should be able to transfer', async () => {
        //     const { contract, owner, otherAccount } = await loadFixture(deploy);
    
        //     await contract.connect(owner).transfer(otherAccount.address, 100);
    
        //     expect(await contract.balanceOf(otherAccount.address)).to.equal(100);
        // });

        it('should not be able to transfer to zero address', async () => {
            const { contract, owner } = await loadFixture(deploy);
    
            await expect(contract.connect(owner).transfer(ZERO_ADDRESS, 100)).to.be.revertedWith("ERC20: transfer to the zero address");
        });

        it('should not be able to transfer if no balance', async () => {
            const { contract, owner, otherAccount } = await loadFixture(deploy);
    
            await expect(contract.connect(otherAccount).transfer(owner.address, 100)).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });

        // it('should be able to transferFrom', async () => {
        //     const { contract, owner, otherAccount } = await loadFixture(deploy);
    
        //     await contract.connect(owner).approve(otherAccount.address, 100);
        //     await contract.connect(otherAccount).transferFrom(owner.address, otherAccount.address, 100);
    
        //     expect(await contract.balanceOf(otherAccount.address)).to.equal(100);
        // });

        it('should not be able to transferFrom to zero address', async () => {
            const { contract, owner } = await loadFixture(deploy);
    
            await expect(contract.connect(owner).transferFrom(ZERO_ADDRESS, owner.address, 100)).to.be.revertedWith("ERC20: insufficient allowance");
        });

        it('should not be able to transferFrom if no balance', async () => {
            const { contract, owner, otherAccount } = await loadFixture(deploy);
    
            await expect(contract.connect(otherAccount).transferFrom(owner.address, otherAccount.address, 100)).to.be.revertedWith("ERC20: insufficient allowance");
        });
    });

    describe('Allowance', () => {
        it('should be able to approve', async () => {
            const { contract, owner, otherAccount } = await loadFixture(deploy);
    
            await contract.connect(owner).approve(otherAccount.address, 100);
    
            expect(await contract.allowance(owner.address, otherAccount.address)).to.equal(100);
        });

        it('should not be able to approve to zero address', async () => {
            const { contract, owner } = await loadFixture(deploy);
    
            await expect(contract.connect(owner).approve(ZERO_ADDRESS, 100)).to.be.revertedWith("ERC20: approve to the zero address");
        });

        it('should increase allowance', async () => {
            const { contract, owner, otherAccount } = await loadFixture(deploy);
    
            await contract.connect(owner).approve(otherAccount.address, 100);
            await contract.connect(owner).increaseAllowance(otherAccount.address, 100);
    
            expect(await contract.allowance(owner.address, otherAccount.address)).to.equal(200);
        });

        it('should not be able to increase allowance to zero address', async () => {
            const { contract, owner } = await loadFixture(deploy);
    
            await expect(contract.connect(owner).increaseAllowance(ZERO_ADDRESS, 100)).to.be.revertedWith("ERC20: approve to the zero address");
        });

        it('should decrease allowance', async () => {
            const { contract, owner, otherAccount } = await loadFixture(deploy);
    
            await contract.connect(owner).approve(otherAccount.address, 100);
            await contract.connect(owner).decreaseAllowance(otherAccount.address, 50);
    
            expect(await contract.allowance(owner.address, otherAccount.address)).to.equal(50);
        });

        it('should not be able to decrease allowance to zero address', async () => {
            const { contract, owner} = await loadFixture(deploy);

            await expect(contract.connect(owner).decreaseAllowance(ZERO_ADDRESS, 50)).to.be.revertedWith("ERC20: decreased allowance below zero");
        });
    });

    describe('ContractURI', () => {
        it('should be able to set contractURI', async () => {
            const { contract, owner } = await loadFixture(deploy);
    
            await contract.connect(owner).setContractURI("https://example.com");
    
            expect(await contract.contractURI()).to.equal("https://example.com");
        });

        it('should not be able to set contractURI by non-owner', async () => {
            const { contract, otherAccount } = await loadFixture(deploy);
    
            await expect(contract.connect(otherAccount).setContractURI("https://example.com")).to.be.revertedWith("Not authorized");
        });
    });

    describe('Burn', () => {
        // it('should be able to burn', async () => {
        //     const { contract, owner } = await loadFixture(deploy);
    
        //     await contract.connect(owner).burn(100);
    
        //     expect(await contract.balanceOf(owner.address)).to.equal(0);
        // });

        it('should not be able to burn more than balance', async () => {
            const { contract, owner } = await loadFixture(deploy);
    
            await expect(contract.connect(owner).burn(100)).to.be.revertedWith("not enough balance");
        });

        it('should not be able to burn to zero address', async () => {
            const { contract, owner } = await loadFixture(deploy);
    
            await expect(contract.connect(owner).burnFrom(ZERO_ADDRESS, 100)).to.be.revertedWith("not enough balance");
        });

        // it('should be able to burnFrom', async () => {
        //     const { contract, owner, otherAccount } = await loadFixture(deploy);
    
        //     await contract.connect(owner).burnFrom(otherAccount.address, 100);
    
        //     expect(await contract.balanceOf(otherAccount.address)).to.equal(0);
        // });

        it('should not be able to burnFrom by non-owner', async () => {
            const { contract, owner, otherAccount } = await loadFixture(deploy);
    
            await expect(contract.connect(otherAccount).burnFrom(owner.address, 100)).to.be.revertedWith("Not authorized to burn.");
        });
    });

    describe('ClaimConditions', () => {
        it('should be able to set claim conditions', async () => {
            const { contract, owner, usdc, timestamp } = await loadFixture(deploy);
            await contract.connect(owner).setClaimConditions(DEFAULT_CLAIM_CONDITION(usdc.address, timestamp), true)
            
            const condition = await contract.claimCondition();

            expect(condition[0]).to.equal(BigNumber.from(timestamp));
            expect(condition[1]).to.equal(ethers.utils.parseEther("1500"));
            expect(condition[2]).to.equal(0);
            expect(condition[3]).to.equal(ethers.utils.parseEther("10"));
            expect(condition[4]).to.equal(EMPTY_MERKLE_ROOT);
            expect(condition[5]).to.equal(ethers.utils.parseEther("0.1"));
            expect(condition[6]).to.equal(usdc.address);
            expect(condition[7]).to.equal('');
        });

        it('should not be able to set claim conditions by non-owner', async () => {
            const { contract, otherAccount, usdc, timestamp } = await loadFixture(deploy);
    
            await expect(contract.connect(otherAccount).setClaimConditions(DEFAULT_CLAIM_CONDITION(usdc.address, timestamp), true)).to.be.revertedWith("Not authorized");
        });
    });

    describe('Claim', () => {
        it('should be able to claim', async () => {
            const { contract, owner, usdc, timestamp } = await loadFixture(deploy);

            await contract.connect(owner).setClaimConditions(DEFAULT_CLAIM_CONDITION(usdc.address, timestamp), true);

            const _allowlistProof = {
                proof: [EMPTY_MERKLE_ROOT],
                quantityLimitPerWallet: ethers.utils.parseEther("10"),
                pricePerToken: ethers.utils.parseEther("0.1"),
                currency: usdc.address
            };

            // const leaf = ethers.utils.keccak256(
            //     ethers.utils.defaultAbiCoder.encode(
            //         ["address", "uint256", "uint256", "address"],
            //         [owner.address, _allowlistProof.quantityLimitPerWallet, _allowlistProof.pricePerToken, _allowlistProof.currency]
            //     )
            // );
            
            await contract.connect(owner).claim(owner.address, ethers.utils.parseEther("1"), usdc.address, ethers.utils.parseEther("0.1"), _allowlistProof, EMPTY_MERKLE_ROOT);

            expect(await contract.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1"));
        });
    });

});