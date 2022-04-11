const { expect } = require("chai");
const { ethers } = require("hardhat");
const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);
const BN = ethers.BigNumber;

describe("NFTMarketplace", function() {
  const URI = "test.uri";
  let deployer, addr1, addr2, addr3, nft, marketplace;
  const serviceFeePercent = 2;
  const creatorFeePercent = 10;

  beforeEach(async () => {
    const NFT = await ethers.getContractFactory("NFT");
    const Marketplace = await ethers.getContractFactory("Marketplace");

    [deployer, addr1, addr2, addr3] = await ethers.getSigners();
    nft = await NFT.deploy();
    marketplace = await Marketplace.deploy(serviceFeePercent, creatorFeePercent);
  });

  describe("NFT", function() {
    it("It's possible to mint new NFT", async function () {
      await nft.connect(addr1).mint(URI);

      expect(await nft.getCreator(1)).to.equal(addr1.address);
      expect(await nft.getCurrentTokenId()).to.equal(1);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.tokenURI(1)).to.equal(URI);
    });

    it("It's possible to transfer NFT", async function() {
      await nft.connect(addr1).mint(URI);

      await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    });

    it("It's possible for approver transfer NFT", async function() {
      await nft.connect(addr1).mint(URI);
      await nft.connect(addr1).approve(addr2.address, 1);

      await nft.connect(addr2).transferFrom(addr1.address, addr3.address, 1);
      expect(await nft.ownerOf(1)).to.equal(addr3.address);
    });

    it("It's possible for operator to transfer NFT", async function() {
      await nft.connect(addr1).mint(URI);
      await nft.connect(addr1).setApprovalForAll(addr2.address, true);

      await nft.connect(addr2).transferFrom(addr1.address, addr3.address, 1);
      expect(await nft.ownerOf(1)).to.equal(addr3.address); 
    });
  });

  describe("List NFT to Market", function () {
    beforeEach(async function() {
      await nft.connect(addr1).mint(URI);
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
    });

    it("Should list item to market, tranfer NFT to marketplace, emit event NewNFTListed event", async function() {
      await expect(marketplace.connect(addr1).listItem(nft.address, 1, toWei(1)))
          .to.emit(marketplace, "NewNFTListed")
          .withArgs(
            1,
            nft.address,
            1,
            toWei(1),
            addr1.address
          );
      
      expect(await nft.ownerOf(1)).to.equal(marketplace.address);
      expect(await marketplace.getTotalItem()).to.equal(1);

      const item = await marketplace.listItems(1);
      expect(item.itemId).to.equal(1);
      expect(item.nft).to.equal(nft.address);
      expect(item.tokenId).to.equal(1);
      expect(item.price).to.equal(toWei(1));
      expect(item.itemState).to.equal(0);
    });

    it("Should fail if price is zero", async function () {
      await expect(marketplace.connect(addr1).listItem(nft.address, 1, 0))
            .to.be.revertedWith("Price must be greater than zezo!");
    });
  });

  describe("Buy NFT", function() {
    const price = 1;

    beforeEach(async function() {
      await nft.connect(addr1).mint(URI);
      await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 1);

      await nft.connect(addr2).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(addr2).listItem(nft.address, 1, toWei(1));
    });

    it("Should tranfer NFT to buyer, charge fees for creater and market emit event, update item as sold.", async function() {
      const sellerInititalBal = await addr2.getBalance();
      const creatorInititalBal = await addr1.getBalance();
      const marketOwnerBal = await deployer.getBalance();

      await expect(marketplace.connect(addr3).purchaseItem(1, { value: toWei(1) }))
        .to.emit(marketplace, "NFTPurchased")
        .withArgs(
          1,
          nft.address,
          1,
          toWei(1),
          addr1.address,
          addr2.address,
          addr3.address
        );

      const sellerFinalBal = await addr2.getBalance();
      const creatorFinalBal = await addr1.getBalance();
      const marketOwnerFinalBal = await deployer.getBalance();
      
      const serviceFee = toWei(1).mul(BN.from(serviceFeePercent)).div(BN.from(100));
      await expect(marketOwnerFinalBal).to.equal(marketOwnerBal.add(serviceFee));

      const creatorFee = toWei(1).mul(BN.from(creatorFeePercent)).div(BN.from(100));
      await expect(creatorFinalBal).to.equal(creatorInititalBal.add(creatorFee));

      const sellerProfit = toWei(1).sub(serviceFee).sub(creatorFee);
      await expect(sellerFinalBal).to.equal(sellerInititalBal.add(sellerProfit));

      expect(await nft.ownerOf(1)).to.equal(addr3.address);
      expect((await marketplace.listItems(1)).itemState).to.equal(2);
    });

    it("Should fail when not send enough ETH", async function () {
      expect(
        marketplace.connect(addr3).purchaseItem(1, { value: toWei(0.5) })
      ).to.be.revertedWith("Not enough eth to purchase item");
    })

    it("Should fail for invalid token id", async function () {
      expect(
        marketplace.connect(addr3).purchaseItem(2, { value: toWei(0.5) })
      ).to.be.revertedWith("Item doesn't exist.");
    })

    it("Should fail for purchasing item already sold", async function () {
      await marketplace.connect(deployer).purchaseItem(1, { value: toWei(1) });
      expect(
        marketplace.connect(addr3).purchaseItem(1, { value: toWei(0.5) })
      ).to.be.revertedWith("Item already sold.");
    })

  });
});