const { expect } = require("chai");
const { ethers } = require("hardhat");

// Real ether rate... can differ because we can set rate dynamically.
// What is rate for 1 hour?
// Is it completely configurable?

describe("Calend3", function () {
  let Contract, contract;
  let owner, addr1, addr2;
  let orgOwnerTestBalance = 0;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    orgOwnerTestBalance = await ethers.provider.getBalance(owner.address);

    Contract = await ethers.getContractFactory("Calend3");
    contract = await Contract.deploy(ethers.utils.parseEther("1")); // Yes, for one minutes... Good rate. ;)
    await contract.deployed();

    const deploymentCost = orgOwnerTestBalance - await ethers.provider.getBalance(owner.address); // Convert to ether...
    const convertedToEth = deploymentCost / 1e18;

    console.log(`Deployment cost of this contract on hardhat`, convertedToEth);
  });

  it("Should return the new rate once it's changed", async function () {
    expect(await contract.getRate()).to.equal(ethers.utils.parseEther("1"));

    const tx = await contract.setRate(ethers.utils.parseEther("3"));

    // wait until the transaction is mined
    await tx.wait();

    expect(await contract.getRate()).to.equal(ethers.utils.parseEther("3"));
  });


  it("Should return the rate per Hour", async function () {
    expect(await contract.getRatePerHour()).to.equal(ethers.utils.parseEther("60"));
  });

  it("Should return the rate for 1 minute", async function () {
    expect(await contract.getRatePer(1)).to.equal(ethers.utils.parseEther("1"));
  });


  it("Should be blocked from setting rate as msg is not owner", async function () {
    await expect(contract.connect(addr1).setRate("1")).to.be.revertedWith("Only owner can change rate");
  });

  it("Should fail, as appointment requester did not pay enough", async function () {
    // TODO IDSME MUST needs to happen.. {value:  ethers.utils.parseEther("0.1")}
    await expect(contract.connect(addr2).createAppointment("Meeting with Part Time Ids", 0, 60, {value: ethers.utils.parseEther("59")})).to.be.revertedWith("You need to pay at least: 60000000000000000000, you tried to pay: 59000000000000000000 WEI");
  });

  it("Should add 1 as appointment requester payed exactly the right amount, but no tip", async function () {
    const tx = await contract.createAppointment("Meeting with Part Time Ids", 0, 60, {value:  ethers.utils.parseEther("60")});
    //console.log(await contract.callStatic.createAppointment("Meeting with Part Time Ids", 0, 60, {value:  ethers.utils.parseEther("60")}));


    const rc = await tx.wait(); // 0ms, as tx is already confirmed
    const event = rc.events.find(event => event.event === 'Deposit');
    const [from, to, value] = event.args;
    console.log(`logging events:>`,from, to, value);

    const appointments = await contract.getAppointments();

    expect(appointments.length).to.equal(1);

    const addr2Balance = await ethers.provider.getBalance(addr2.address);

    const costOfTransaction = (orgOwnerTestBalance - addr2Balance) / 1e18;
    console.log(`What does 1 new appointment cost..?  ${costOfTransaction} ETH`); // 60.0002404279103 ETH why not 60? As operation cost 0,72 usdt.
    console.log(`What does 1 new appointment cost..?  ${costOfTransaction * 3000} USDT`); // 0.72 USDT.. mmm, should this be lower. payed 60 ETH?

  });

  it("Should fail as appointment requester payed more then fee + tip, thus far to much. If more then (200%) is payed, requester probably made a typo, which will lead to add manual intervention if we don't rollback.", async function () {
    await expect(contract.createAppointment("Meeting with Part Time Ids", 0, 60, {value:  ethers.utils.parseEther("121")})).to.be.revertedWith("You payed to much, payment cannot cannot exceed 200%, you payed: 201%");
  });

  it("Should, be able to tip 100% + max 100% tip, thanks ;)", async function () {
    const tx2 = await contract.createAppointment("Breakfast at Tiffany's", 120, 240, {value:  ethers.utils.parseEther("120")});
    await tx2.wait();

    const appointments = await contract.getAppointments();
    expect(appointments.length).to.equal(1);
  });

  it("Should add two appointments as appointments don't overlap", async function () {
    const tx = await contract.createAppointment("Meeting with Part Time Ids", 0, 60, {value:  ethers.utils.parseEther("60")});
    await tx.wait();

    const tx2 = await contract.createAppointment("Breakfast at Tiffany's", 120, 240, {value:  ethers.utils.parseEther("120")});
    await tx2.wait();

    const appointments = await contract.getAppointments();

    expect(appointments.length).to.equal(2);
  });

  it("Should add first appointment but not second one as overlaps start time", async function () {
    const tx = await contract.createAppointment("Meeting with Part Time Ids", 30, 60, {value:  ethers.utils.parseEther("30")});
    await tx.wait();

    await expect(contract.createAppointment("Meeting with Part Time Larry", 29, 31, {value:  ethers.utils.parseEther("2")})).to.be.revertedWith("New appointment request overlaps start of already existing appointment");

    const appointments = await contract.getAppointments();

    expect(appointments.length).to.equal(1);
  });


  it("Should add first appointment but not second one as overlaps end time", async function () {
    const tx = await contract.createAppointment("Meeting with Part Time Ids", 30, 60, {value:  ethers.utils.parseEther("30")});
    await tx.wait();

    await expect(contract.createAppointment("Meeting with Part Time Larry", 59, 61, {value:  ethers.utils.parseEther("2")})).to.be.revertedWith("New appointment request overlaps end of already existing appointment");

    const appointments = await contract.getAppointments();

    expect(appointments.length).to.equal(1);
  });


  it("Should add first appointment but not second one as falls withing existing appointment", async function () {
    const tx1 = await contract.createAppointment("Meeting with Part Time Ids", 30, 60, {value:  ethers.utils.parseEther("30")});
    await tx1.wait();

    await expect(contract.createAppointment("Meeting with Part Time Larry", 31, 59, {value:  ethers.utils.parseEther("28")})).to.be.revertedWith("New appointment request overlaps as falls within the time of an already existing appointment");

    const appointments = await contract.getAppointments();

    expect(appointments.length).to.equal(1);
  });

  it("Should add first appointment but not second one as surrounds an existing appointment", async function () {
    const tx1 = await contract.createAppointment("Meeting with Part Time Ids", 30, 60, {value:  ethers.utils.parseEther("30")});
    await tx1.wait();

    await expect(contract.createAppointment("Meeting with Part Time Larry", 29, 59, {value:  ethers.utils.parseEther("32")})).to.be.revertedWith("New appointment request overlaps start of already existing appointment");

    const appointments = await contract.getAppointments();

    expect(appointments.length).to.equal(1);
  });

});
