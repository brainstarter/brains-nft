import { time, loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers  } from "hardhat";
import { BigNumber } from "ethers";

describe("BrainVesting", () => {
    async function deploy() {
        const [owner, otherAccount] = await ethers.getSigners();

        const BrainsNFT = await ethers.getContractFactory("BrainsNFT");
        const nftContract = await BrainsNFT.deploy();
    
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        const erc20Contract = await ERC20Mock.deploy('BRAINS', 'BRAINS');
    
        const tx = await nftContract.safeMint(otherAccount.address, "reward.png", ethers.utils.parseUnits("100", 18));
        const receipt = await tx.wait();
        const tokenId: BigNumber = (receipt.events?.[0] as any).args.tokenId;
    
        const BrainVesting = await ethers.getContractFactory("BrainVesting");
        const vestingContract = await BrainVesting.deploy(nftContract.address, erc20Contract.address);

        return { nftContract, vestingContract, owner, otherAccount, tokenId, erc20Contract };
    }

    describe("Deployment", () => {
        it("Should deploy BrainVesting", async () => {
            const { vestingContract } = await loadFixture(deploy);
            expect(vestingContract.address).to.be.properAddress;
        });

        it('Should set the right owner', async () => {
            const { vestingContract, owner } = await loadFixture(deploy);
            expect(await vestingContract.owner()).to.equal(owner.address);
        });

        it("Should return empty vestings", async () => {
            const { vestingContract, otherAccount } = await loadFixture(deploy);
            expect(await vestingContract.vestings(otherAccount.address)).to.be.empty;
        });
    });

    describe("Exchange", () => {
        it("Should exchange NFT for BRAINS", async () => {
            const { nftContract, vestingContract, otherAccount, tokenId, erc20Contract } = await loadFixture(deploy);
            await erc20Contract.mint(vestingContract.address, ethers.utils.parseUnits("100", 18));
            await nftContract.connect(otherAccount).setApprovalForAll(vestingContract.address, true);
            await vestingContract.connect(otherAccount).exchange(tokenId);
            expect(await erc20Contract.balanceOf(vestingContract.address)).to.equal(ethers.utils.parseUnits("0", 18));
            const vestings = await vestingContract.vestings(otherAccount.address);
            expect(vestings).to.not.be.empty;
            expect(await erc20Contract.balanceOf(vestings[0])).to.equal(ethers.utils.parseUnits("95", 18));
            expect(await erc20Contract.balanceOf(otherAccount.address)).to.equal(ethers.utils.parseUnits("5", 18));
        });

        it("Should not exchange NFT for BRAINS if not approved", async () => {
            const { vestingContract, otherAccount, tokenId, erc20Contract } = await loadFixture(deploy);
            await erc20Contract.mint(vestingContract.address, ethers.utils.parseUnits("100", 18));
            await expect(vestingContract.connect(otherAccount).exchange(tokenId)).to.be.revertedWith('ERC721: caller is not token owner or approved');
        });

        it("Should not exchange if insufficient BRAINS", async () => {
            const { nftContract, vestingContract, otherAccount, tokenId, erc20Contract } = await loadFixture(deploy);
            await nftContract.connect(otherAccount).setApprovalForAll(vestingContract.address, true);
            await expect(vestingContract.connect(otherAccount).exchange(tokenId)).to.be.revertedWith('BrainVesting: insufficient balance for exchange');
        });

        it("Should not exchange if not NFT owner", async () => {
            const { nftContract, erc20Contract, vestingContract, owner, otherAccount, tokenId } = await loadFixture(deploy);
            await nftContract.connect(otherAccount).setApprovalForAll(vestingContract.address, true);
            await erc20Contract.mint(vestingContract.address, ethers.utils.parseUnits("100", 18));
            await expect(vestingContract.connect(owner).exchange(tokenId)).to.be.revertedWith('BrainVesting: caller is not the owner of the NFT');
        });

        it("Should not exchange if NFT already exchanged", async () => {
            const { nftContract, erc20Contract, vestingContract, otherAccount, tokenId } = await loadFixture(deploy);
            await nftContract.connect(otherAccount).setApprovalForAll(vestingContract.address, true);
            await erc20Contract.mint(vestingContract.address, ethers.utils.parseUnits("100", 18));
            await vestingContract.connect(otherAccount).exchange(tokenId);
            await expect(vestingContract.connect(otherAccount).exchange(tokenId)).to.be.revertedWith('ERC721: invalid token ID');
        });

        it("Should not exchange if NFT does not exist", async () => {
            const { nftContract, erc20Contract, vestingContract, otherAccount, tokenId } = await loadFixture(deploy);
            await nftContract.connect(otherAccount).setApprovalForAll(vestingContract.address, true);
            await erc20Contract.mint(vestingContract.address, ethers.utils.parseUnits("100", 18));
            await vestingContract.connect(otherAccount).exchange(tokenId);
            await expect(vestingContract.connect(otherAccount).exchange(234123)).to.be.revertedWith('ERC721: invalid token ID');
        });

        it("Should exchange two NFTs and return two vestings", async () => {
            const { nftContract, erc20Contract, vestingContract, otherAccount, tokenId } = await loadFixture(deploy);
            const tx = await nftContract.safeMint(otherAccount.address, "reward2.png", ethers.utils.parseUnits("900", 18));
            const receipt = await tx.wait();
            const tokenId2: BigNumber = (receipt.events?.[0] as any).args.tokenId;
            await nftContract.connect(otherAccount).setApprovalForAll(vestingContract.address, true);
            await erc20Contract.mint(vestingContract.address, ethers.utils.parseUnits("1200", 18));
            await vestingContract.connect(otherAccount).exchange(tokenId);
            await vestingContract.connect(otherAccount).exchange(tokenId2);
            const vestings = await vestingContract.vestings(otherAccount.address);
            expect(await erc20Contract.balanceOf(vestings[0])).to.equal(ethers.utils.parseUnits("95", 18));
            expect(await erc20Contract.balanceOf(vestings[1])).to.equal(ethers.utils.parseUnits((900 * 0.95).toString(), 18));
            expect(await vestingContract.vestings(otherAccount.address)).to.have.length(2);
            expect(await erc20Contract.balanceOf(vestingContract.address)).to.equal(ethers.utils.parseUnits("200", 18));
            expect(await erc20Contract.balanceOf(otherAccount.address)).to.equal(ethers.utils.parseUnits((1000 * 0.05).toString(), 18));
        })
    });

    describe("Payout", () => {
        it("Should payout remaining BRAINS to owner", async () => {
            const { erc20Contract, vestingContract, owner } = await loadFixture(deploy);
            await erc20Contract.mint(vestingContract.address, ethers.utils.parseUnits("100", 18));
            expect(await erc20Contract.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("0", 18));
            await vestingContract.connect(owner).payout();
            expect(await erc20Contract.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("100", 18));
            expect(await erc20Contract.balanceOf(vestingContract.address)).to.equal(ethers.utils.parseUnits("0", 18));
        });

        it("Should not payout if no BRAINS", async () => {
            const { vestingContract, owner } = await loadFixture(deploy);
            await expect(vestingContract.connect(owner).payout()).to.be.revertedWith('BrainVesting: insufficient balance for payout');
        });

        it("Should not payout if not owner", async () => {
            const { erc20Contract, vestingContract, otherAccount } = await loadFixture(deploy);
            await erc20Contract.mint(vestingContract.address, ethers.utils.parseUnits("100", 18));
            await expect(vestingContract.connect(otherAccount).payout()).to.be.revertedWith('Ownable: caller is not the owner');
        });
    });

    describe("Vesting", () => {
        const VESTING_START_DATE = 1718726400;
        const VESTING_DURATION = 31536000;

        const deployVesting = async () => {
            const { nftContract, vestingContract, otherAccount, tokenId, erc20Contract } = await loadFixture(deploy);
            await erc20Contract.mint(vestingContract.address, ethers.utils.parseUnits("100", 18));
            await nftContract.connect(otherAccount).setApprovalForAll(vestingContract.address, true);
            await vestingContract.connect(otherAccount).exchange(tokenId);

            const vestings = await vestingContract.vestings(otherAccount.address);
            const vestingAddress = vestings[0];
            const VestingWallet = await ethers.getContractFactory("VestingWallet");
            const vestingWallet = VestingWallet.attach(vestingAddress);

            return { nftContract, vestingContract, otherAccount, tokenId, erc20Contract, vestingWallet };
        };

        it("Should create vesting wallet with proper beneficiary", async () => {
            const { otherAccount, vestingWallet } = await loadFixture(deployVesting);
            expect(await vestingWallet.beneficiary()).to.equal(otherAccount.address);
        });

        it("Should create vesting wallet with proper BRAINS balance", async () => {
            const { erc20Contract, vestingWallet } = await loadFixture(deployVesting);
            expect(await erc20Contract.balanceOf(vestingWallet.address)).to.equal(ethers.utils.parseUnits("95", 18));
        });

        it("Should create vesting with empty released", async () => {
            const { erc20Contract, vestingWallet} = await loadFixture(deployVesting);
            const released = await vestingWallet["released(address)"].call(vestingWallet, erc20Contract.address);
            expect(released).to.equal("0");
        });

        it("Should create vesting with empty releasable", async () => {
            const { erc20Contract, vestingWallet } = await loadFixture(deployVesting);
            const releasable = await vestingWallet["releasable(address)"].call(vestingWallet, erc20Contract.address);
            expect(releasable).to.equal("0");
        });

        it("Should properly calculate releasable", async () => {
            const { vestingWallet, erc20Contract } = await loadFixture(deployVesting);
            const VESTING_HALF_YEAR = 180 * 24 * 60 * 60;

            await time.increaseTo(VESTING_START_DATE + VESTING_HALF_YEAR); // 6 months
            await mine();
            const releasable = parseFloat(ethers.utils.formatUnits(await vestingWallet["releasable(address)"].call(vestingWallet, erc20Contract.address), 18));
            const expectedReleasable = (100 * 0.95 * ((VESTING_START_DATE + VESTING_HALF_YEAR) - VESTING_START_DATE)) / VESTING_DURATION;
            expect(releasable).to.be.closeTo(expectedReleasable, 0.1);
        });

        it("Should release all BRAINS", async () => {
            const { vestingWallet, otherAccount, erc20Contract } = await loadFixture(deployVesting);
            await time.increaseTo(VESTING_START_DATE + VESTING_DURATION);
            await mine();
            await vestingWallet.connect(otherAccount)["release(address)"].call(vestingWallet, erc20Contract.address);
            expect(await erc20Contract.balanceOf(vestingWallet.address)).to.equal(ethers.utils.parseUnits("0", 18));
            expect(await erc20Contract.balanceOf(await vestingWallet.beneficiary())).to.equal(ethers.utils.parseUnits("100", 18));
        });

        it("Should release partial BRAINS", async () => {
            const { vestingWallet, otherAccount, erc20Contract } = await loadFixture(deployVesting);
            const VESTING_HALF_YEAR = 180 * 24 * 60 * 60;

            await time.increaseTo(VESTING_START_DATE + VESTING_HALF_YEAR);
            await mine();
            await vestingWallet.connect(otherAccount)["release(address)"].call(vestingWallet, erc20Contract.address);
            const expectedReleased = (100 * 0.95 * ((VESTING_START_DATE + VESTING_HALF_YEAR) - VESTING_START_DATE)) / VESTING_DURATION;
            const vestingWalletBalance = parseFloat(ethers.utils.formatUnits(await erc20Contract.balanceOf(vestingWallet.address), 18));
            const beneficiaryBalance = parseFloat(ethers.utils.formatUnits(await erc20Contract.balanceOf(await vestingWallet.beneficiary()), 18));
            expect(vestingWalletBalance).to.be.closeTo(100 * 0.95 - expectedReleased, 0.1);
            expect(beneficiaryBalance).to.be.closeTo(expectedReleased + 100 * 0.05, 0.1);

            const released = parseFloat(ethers.utils.formatUnits(await vestingWallet["released(address)"].call(vestingWallet, erc20Contract.address), 18));
            expect(released).to.be.closeTo(expectedReleased, 0.1);

        });
    });
});
