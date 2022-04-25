const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Calend3", function () {
  it("Should return the new rate once it's changed", async function () {
    const Contract = await ethers.getContractFactory("Calend3");
    const contract = await Contract.deploy("13");
    await contract.deployed();

    expect(await contract.getRate()).to.equal("13");

    const tx = await contract.setRate("1313");

    // wait until the transaction is mined
    await tx.wait();

    expect(await contract.getRate()).to.equal("1313");
  });


  it("Should be blocked from setting rate as msg is not owner", async function () {
    const Contract = await ethers.getContractFactory("Calend3");
    const contract = await Contract.deploy(13);
    await contract.deployed();

    // Change to different user account
    const [owner, user1, user2] = await ethers.getSigners();

    await expect(contract.connect(user2).setRate("1313")).to.be.revertedWith("Only owner can change rate");
  });

});
