import { BigNumber, utils } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";

function delay(ms: number): Promise<any> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const BrainsNFT = await ethers.getContractFactory("BrainsNFT");
  const nft = await BrainsNFT.attach('0x4CEe02f3352f80c07a884c34F163Fd74f41a13c0');

  // let counter = 0;
  // let sum = BigNumber.from(0);
  // while(counter <= 88) {
  //   const tokenValue = await nft.tokenValue(counter);
  //   console.log(`NFT with ID ${counter} has value of ` + formatUnits(tokenValue, 18) + ` $BRAINS`);
  //   sum = sum.add(tokenValue);
  //   counter++;
  // }
  //console.log('total value: ' + formatUnits(sum, 18));
  // console.log('enabling exchange...');
  // const tx = await nft.enableExchange('0xBf80eF1558B362573f469ec3E2493fd49E0f7100')
  // await tx.wait();
  // console.log('exchange enabled');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
