
const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const Contract = await hre.ethers.getContractFactory("Calend3");
    const contract = await Contract.deploy(13);

    await contract.deployed();
    const rate = await contract.getRate();

    console.log("Calend3 deployed to:", contract.address, rate);

    saveFrontendFiles();
}

function saveFrontendFiles() {
    const fs = require("fs");

    const abiDir = __dirname + "/../frontend/src/abis";

    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir);
    }

    const artifact = artifacts.readArtifactSync("Calend3");

    fs.writeFileSync(
        abiDir + "/Calend3.json",
        JSON.stringify(artifact, null, 2)
    );
    console.log("Saved Calend3 ABI to:", abiDir + "/Calend3.json");
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




