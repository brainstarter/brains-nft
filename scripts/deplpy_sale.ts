import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const mock = await ERC20Mock.deploy('USDT', 'USDT');

  await mock.deployed();

  await mock.mint(owner.address, ethers.utils.parseEther("1000000000000000000000000000"));

  console.log(`ERC20Mock deployed to: ${mock.address}`);

  const BrainsSale = await ethers.getContractFactory("BrainsSale");
  const drop = await BrainsSale.deploy(owner.address, "MYDROP", "MDRP", "0xbedB21bDBA75aFeB5d8819D474F96De3B82C5fB8");

  await drop.deployed();

  console.log(`BrainsSale deployed to: ${drop.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
