import { ethers } from "hardhat";

async function main() {
  const BrainsNFT = await ethers.getContractFactory("BrainsNFT");
  const nft = await BrainsNFT.deploy();

  await nft.deployed();

  console.log(`BrainsNFT deployed to: ${nft.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
