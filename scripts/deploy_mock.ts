import { ethers } from "hardhat";

const erc20 = "0x0f66602f969dc8579A09dd2813691C629811A193";
const address = '0xA968A996eB3d47B1Cb5D1418f35E693fC65dec2C';

async function main() {
  const [owner] = await ethers.getSigners();

  const reciver = address?.length ? address : owner.address;

  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const mock = erc20?.length ? ERC20Mock.attach(erc20) : await ERC20Mock.deploy('USDT', 'USDT');
  if (!erc20?.length) {
    await mock.deployed();
  }

  console.log(`ERC20Mock deployed to: ${mock.address}`);

  await mock.mint(reciver, ethers.utils.parseUnits("1000000", 6));

  console.log(`ERC20Mock minted`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
