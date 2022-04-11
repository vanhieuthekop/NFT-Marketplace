const { expect } = require("chai");
const { ethers } = require("hardhat");
const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);
const BN = ethers.BigNumber;
const moment = require("moment");

describe("Lottery Management", function() {
  const URI = "test.uri";
  let deployer, addr1, addr2, addr3, nft, lotteryManagement, lotteryVRFConsumer;
  const ticketPrice = ethers.utils.parseEther("0.00001");

  beforeEach(async () => {
    const NFT = await ethers.getContractFactory("NFT");
    const LotteryManagement = await ethers.getContractFactory("LotteryManagement");
    const LotteryVRFConsumer = await ethers.getContractFactory("LotteryVRFConsumer");
    [deployer, addr1, addr2, addr3] = await ethers.getSigners();

    nft = await NFT.deploy();
    lotteryVRFConsumer = await LotteryVRFConsumer.deploy(2482);
    lotteryManagement = await LotteryManagement.deploy(nft.address, lotteryVRFConsumer.address);

    await nft.connect(deployer).mint(URI);
  });

  it("It's possible to create new lottery and buy ticket", async function () {
    await nft.connect(deployer).setApprovalForAll(lotteryManagement.address, true);
    const startTime = moment().unix();
    const endTime = moment().add(5, "minutes").unix();
    await expect(lotteryManagement.connect(deployer).createNewLottery(
        1,
        ticketPrice,
        startTime,
        endTime
      )).to.emit(lotteryManagement, "NewLotteryCreated")
      .withArgs(
        1,
        1,
        ticketPrice,
        startTime,
        endTime
      );

    expect(await nft.ownerOf(1)).to.equal(lotteryManagement.address);
    const lottery = await lotteryManagement.getLottery(1);
    expect(lottery.lotteryId).to.equal(1);
    expect(lottery.tokenId).to.equal(1);
    expect(lottery.startTime).to.equal(startTime);
    expect(lottery.endTime).to.equal(endTime);
    expect(lottery.ticketPrice).to.equal(ticketPrice);

    await lotteryManagement.connect(addr1).buyTicket(1, {
      value: ticketPrice
    });
    await lotteryManagement.connect(addr2).buyTicket(1, {
      value: ticketPrice
    });
    expect(lotteryManagement.connect(addr1).buyTicket(1, {
      value: ticketPrice
    })).to.be.revertedWith("User already got ticket of this lottery");
    expect(
      lotteryManagement.connect(addr3).buyTicket(1, {
        value: ethers.utils.parseEther("0.0000001")
      })
    ).to.be.revertedWith("Not enough ETH to buy ticket!");
    const players = await lotteryManagement.getPlayers(1);
    expect(players.length).to.equal(2);
  });
});