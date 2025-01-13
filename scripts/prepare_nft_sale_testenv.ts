import { ethers } from "hardhat";

const nft = "0x261f87e342F789d7A3f36D316E6A93fc4b095053";
const erc20 = "0x0f66602f969dc8579A09dd2813691C629811A193";
const recipient = "0xA968A996eB3d47B1Cb5D1418f35E693fC65dec2C";
const sale = "0xB9463CDA9b4040b98635271BFB278d9a40680501";
const exchange = "0xb5E678Dd7174BD465e0eF4a094AF01C7201f2CE5";
const brains = '0x73b573148740cB36Dbee4AFbE63cE51dE8AfCCbF';

function delay(ms: number): Promise<any> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const BrainsNFT = await ethers.getContractFactory("BrainsNFT");
  const nftContract = nft?.length
    ? BrainsNFT.attach(nft)
    : await BrainsNFT.deploy();

  if (!nft?.length) {
    await nftContract.deployed();
  }
  console.log("NFT deployed to:", nftContract.address);

  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const erc20Contract = erc20?.length
    ? ERC20Mock.attach(erc20)
    : await ERC20Mock.deploy("TESTT", "TESTT");
  if (!erc20?.length) {
    await erc20Contract.deployed();
  }
  console.log("ERC20 deployed to:", erc20Contract.address);

  const BrainNFTSale = await ethers.getContractFactory("BrainNFTSale");
  const saleContract = sale?.length
    ? BrainNFTSale.attach(sale)
    : await BrainNFTSale.deploy(
        nft,
        erc20,
        erc20,
        recipient,
        ethers.utils.parseUnits("0.005", 6)
      );
  if (!sale?.length) {
    await saleContract.deployed();
  }
  console.log("Sale deployed to:", saleContract.address);
  const BrainsExchange = await ethers.getContractFactory("BrainsExchange");

  const exchangeContract = exchange?.length
    ? BrainsExchange.attach(exchange)
    : await BrainsExchange.deploy(nftContract.address, brains);
  if (!exchange?.length) {
    await exchangeContract.deployed();
  }

  console.log("Exchange deployed to:", exchangeContract.address);

  await nftContract.safeMint(
    saleContract.address,
    `https://stbrainstarterprod.blob.core.windows.net/nfts/42.json`,
    ethers.utils.parseUnits("10000", 18)
  );
  console.log("Minted NFT 1");
  await delay(5000);
  await nftContract.safeMint(
    saleContract.address,
    `https://stbrainstarterprod.blob.core.windows.net/nfts/43.json`,
    ethers.utils.parseUnits("100000", 18)
  );
  console.log("Minted NFT 2");
  await delay(5000);
  await nftContract.safeMint(
    saleContract.address,
    `https://stbrainstarterprod.blob.core.windows.net/nfts/44.json`,
    ethers.utils.parseUnits("500000", 18)
  );
  console.log("Minted NFT 3");
  await delay(5000);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
