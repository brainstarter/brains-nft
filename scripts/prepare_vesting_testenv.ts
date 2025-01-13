import { ethers } from "hardhat";

const nft = '0x261f87e342F789d7A3f36D316E6A93fc4b095053';
const erc20 = '0xEd41BA9Bc9A271055ad202ae599dc4BbC3AEC5b3';
const vesting = '0xA81698A8048f2FC5ad016a0c9C71b818f61197B2';
const shouldMint = true;

async function main() {
    const BrainsNFT = await ethers.getContractFactory("BrainsNFT");
    const nftContract = nft?.length ? BrainsNFT.attach(nft) : await BrainsNFT.deploy();
    
    if(!nft?.length) {
        await nftContract.deployed();
    }
    console.log("NFT deployed to:", nftContract.address);

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const erc20Contract = erc20?.length ? ERC20Mock.attach(erc20) : await ERC20Mock.deploy('TESTT', 'TESTT');
    if(!erc20?.length) {
        await erc20Contract.deployed();
    }
    console.log("ERC20 deployed to:", erc20Contract.address);

    if(shouldMint) {
        for(let i = 0; i < 1; i++) {
            await nftContract.safeMint('0xA968A996eB3d47B1Cb5D1418f35E693fC65dec2C', `reward-${i}.png`, ethers.utils.parseUnits("100", 18));
            console.log(`Minted NFT ${i}`);
        }
    }

    const BrainVesting = await ethers.getContractFactory("BrainVesting");
    const vestingContract = vesting?.length ? BrainVesting.attach(vesting) : await BrainVesting.deploy(nftContract.address, erc20Contract.address);
    if(!vesting?.length) {
        await vestingContract.deployed();
    }
    console.log("Vesting deployed to:", vestingContract.address);

    if(shouldMint) {
        await erc20Contract.mint(vestingContract.address, ethers.utils.parseUnits("1000000", 18));
        console.log("Minted 1M BRAINS to vesting contract");
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });