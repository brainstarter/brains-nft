import { ethers } from "hardhat";

function delay(ms: number): Promise<any> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const BrainsNFT = await ethers.getContractFactory("BrainsNFT");
  const nft = await BrainsNFT.attach('0x4CEe02f3352f80c07a884c34F163Fd74f41a13c0');

  console.log('started minting');
  const recipients = [
    { to: '', uri: 'https://stbrainstarterprod.blob.core.windows.net/nfts/33.json', tokenValues: 2  },
  ];

  for(let i = 0; i < recipients.length; i++) {
    if(!recipients[i]) continue;
    const tx = await nft.safeMint(recipients[i].to, recipients[i].uri, recipients[i].tokenValues);
    console.log('minted to ' + recipients[i].to + ' with tx: ' + tx.hash);
    await delay(180000);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
