import { ethers } from "hardhat";

async function main() {
    const BrainsNFT = await ethers.getContractFactory("BrainsNFT");
    const nft = await BrainsNFT.attach('0x4CEe02f3352f80c07a884c34F163Fd74f41a13c0');

    await nft.setTokenValue(39, 0);
}  

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});