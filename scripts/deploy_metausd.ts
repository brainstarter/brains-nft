import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const MetaUSDT = await ethers.getContractFactory("MetaUSDT");
  const mock = await MetaUSDT.deploy("MetaTest", "MTT");

  await mock.deployed();

  console.log(`MetaUSDT deployed to: ${mock.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
