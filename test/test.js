const { expect } = require("chai");
const { ethers } = require("hardhat");

// Real ether rate... can differ because we can set rate dynamically.
// What is rate for 1 hour?

describe("Calend3", function () {
  let Contract, contract;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    Contract = await ethers.getContractFactory("Calend3");
    contract = await Contract.deploy("1");
    await contract.deployed();
  });

  it("Should return the new rate once it's changed", async function () {
    expect(await contract.getRate()).to.equal("1");

    const tx = await contract.setRate("1313");

    // wait until the transaction is mined
    await tx.wait();

    expect(await contract.getRate()).to.equal("1313");
  });


  it("Should be blocked from setting rate as msg is not owner", async function () {
    await expect(contract.connect(addr1).setRate("1")).to.be.revertedWith("Only owner can change rate");
  });

  it("Should fail, as appointment requester did not pay enough", async function () {
    await expect(contract.createAppointment("Meeting with Part Time Ids", 0, 60, {value: "59"})).to.be.revertedWith("You need to pay at least: 60, you tried to pay: 59 WEI");
  });

  it("Should add 1 as appointment requester payed exactly the right amount, but no tip", async function () {
    const tx = await contract.createAppointment("Meeting with Part Time Ids", 0, 60, {value: "60"});
    await tx.wait();

    const appointments = await contract.getAppointments();

    expect(appointments.length).to.equal(1);
  });

  it("Should fail as appointment requester payed more then fee + tip, thus far to much. If more then (200%) is payed, requester probably made a typo, which will lead to add manual intervention if we don't rollback.", async function () {
    await expect(contract.createAppointment("Meeting with Part Time Ids", 0, 60, {value: "121"})).to.be.revertedWith("You payed to much, payment cannot cannot exceed 200%, you payed: 201%");
  });

  it("Should, be able to tip 100% + max 100% tip, thanks ;)", async function () {
    const tx2 = await contract.createAppointment("Breakfast at Tiffany's", 120, 240, {value: "120"});
    await tx2.wait();

    const appointments = await contract.getAppointments();
    expect(appointments.length).to.equal(1);
  });

  it("Should add two appointments as appointments don't overlap", async function () {
    const tx = await contract.createAppointment("Meeting with Part Time Ids", 0, 60, {value: "60"});
    await tx.wait();

    const tx2 = await contract.createAppointment("Breakfast at Tiffany's", 120, 240, {value: "120"});
    await tx2.wait();

    const appointments = await contract.getAppointments();

    expect(appointments.length).to.equal(2);
  });

  it("Should add first appointment but not second one as overlaps start time", async function () {
    const tx = await contract.createAppointment("Meeting with Part Time Ids", 30, 60, {value: "30"});
    await tx.wait();

    await expect(contract.createAppointment("Meeting with Part Time Larry", 29, 31, {value: "2"})).to.be.revertedWith("New appointment request overlaps start of already existing appointment");

    const appointments = await contract.getAppointments();

    expect(appointments.length).to.equal(1);
  });


  it("Should add first appointment but not second one as overlaps end time", async function () {
    const tx = await contract.createAppointment("Meeting with Part Time Ids", 30, 60, {value: "30"});
    await tx.wait();

    await expect(contract.createAppointment("Meeting with Part Time Larry", 59, 61, {value: "2"})).to.be.revertedWith("New appointment request overlaps end of already existing appointment");

    const appointments = await contract.getAppointments();

    expect(appointments.length).to.equal(1);
  });


  it("Should add first appointment but not second one as falls withing existing appointment", async function () {
    const tx1 = await contract.createAppointment("Meeting with Part Time Ids", 30, 60, {value: "30"});
    await tx1.wait();

    await expect(contract.createAppointment("Meeting with Part Time Larry", 31, 59, {value: "28"})).to.be.revertedWith("New appointment request overlaps as falls within the time of an already existing appointment");

    const appointments = await contract.getAppointments();

    expect(appointments.length).to.equal(1);
  });

  it("Should add first appointment but not second one as surrounds an existing appointment", async function () {
    const tx1 = await contract.createAppointment("Meeting with Part Time Ids", 30, 60, {value: "30"});
    await tx1.wait();

    await expect(contract.createAppointment("Meeting with Part Time Larry", 29, 59, {value: "32"})).to.be.revertedWith("New appointment request overlaps start of already existing appointment");

    const appointments = await contract.getAppointments();

    expect(appointments.length).to.equal(1);
  });

});
