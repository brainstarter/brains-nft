import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const tokenDropAddress = "0x7291F7f1597E68B31fb1Ed34283857c00ad1b2bC";
  const metaUsdAddress = "0xafaa7f89F44D574972f181f48de03d2734B425cC";
  const receiverAddress = '0xb45440768f425f3e9993b84985b608a5afc93598';

  const usdtAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // await deployToken("USDT", "USDT", owner.address);
  const usdcAddress = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"; //await deployToken("USDC", "USDC", owner.address);

  const MetaUSDT = await ethers.getContractFactory("MetaUSDT");
  const mock = await MetaUSDT.attach(metaUsdAddress);

  await mock.initialize(usdtAddress, usdcAddress, tokenDropAddress, receiverAddress);

  const usdt = await mock.usdt();
  const usdc = await mock.usdc();

  console.log(`USDT address: ${usdt}; USDC address: ${usdc}`);
}

async function deployToken(
  name: string,
  symbol: string,
  owner: string
): Promise<string> {
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const mock = await ERC20Mock.deploy(name, symbol);

  await mock.deployed();

  await mock.mint(owner, "100000000000");

  return mock.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
