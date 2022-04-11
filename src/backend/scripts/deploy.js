//Sample URI to create NFT
const items = [
  "ipfs://bafyreiafiosl3c6s3bstw7zrhxu2g3caelzvq3ujf53art3nqcle7gws6e/metadata.json",
  "ipfs://bafyreia4l3q3ycrun3ykvqttgam3hr74h64qct5d3gv2gey6ptaalc4ffm/metadata.json",
  "ipfs://bafyreigsufzjz7su43kcksyvcqwcqyapbje75besejekpxz5k6heradfvi/metadata.json",
  "ipfs://bafyreiba4wlxdvbw72uwaef2ddr5vrtesjpu5yk6dj7viwhxz2f33plmuy/metadata.json",
  "ipfs://bafyreif5m3vt5cxqifkl4c2zceybi23scacxg5xmjni32dnq7pzj5xctau/metadata.json",
  "ipfs://bafyreifelwaspld3kfp4niqgxp3bh4t2gw72u43e7grvubs5exe3wx55ey/metadata.json",
  "ipfs://bafyreihsh6iayuhckvzqotlu4pkxv4lvrisbyu5x6c3p6l7cuamlg7qk4q/metadata.json",
  "ipfs://bafyreide2k4ndcmbvu4oh6xff464hhvyyp2rh7j3il3b37n52wqaa7r3aq/metadata.json",
  "ipfs://bafyreid5pidaquxt6clj7sqmgbon5go7zdi2k6qhkocjgmfthoz7zcty5i/metadata.json",
  "ipfs://bafyreiej4dheryfmbqyv2zwvia6em6dren74d6sz6ufmp2kqe5hs32snuu/metadata.json",
  "ipfs://bafyreihdelytrcau2xq6rt6nakwbg6dqa2ayecpr43chsxgl74s7tfadjq/metadata.json",
  "ipfs://bafyreib4jvbanzgu44zjzmgapnq2afafeogl7wsvxkmmiikwwqkqur6h7i/metadata.json",
  "ipfs://bafyreicybr7zo2hpty3ef4zg66z4aagljxi22iixli7sokx7yq35vcaux4/metadata.json",
  "ipfs://bafyreihxbjpobhwgr627qkfqtdgejexblynn7sfwupplvkp27sta6edxz4/metadata.json",
  "ipfs://bafyreiggba74ylqlzvmhpptfwq22krjlqcqitv5dlnqosq7ntm7wvtirzu/metadata.json",
  "ipfs://bafyreibjcj5xynoajmryixa77z2zh2aolprmzdm6q7d7ztmcbrp3rbr47u/metadata.json"
]

const moment = require("moment");

async function main() {

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const NFT = await ethers.getContractFactory("NFT");
  const nft = await NFT.deploy();
  console.log("NFT contract address: ", nft.address);

  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(2, 10);
  console.log("Marketplace contract address: ", marketplace.address);
  
  const LotteryVRFConsumer = await ethers.getContractFactory("LotteryVRFConsumer");
  const lotteryVRFConsumer = await LotteryVRFConsumer.deploy(2482);
  console.log("LotteryVRFConsumer contract address: ", lotteryVRFConsumer.address);

  const LotteryManagement = await ethers.getContractFactory("LotteryManagement");
  const lotteryManagement = await LotteryManagement.deploy(nft.address, lotteryVRFConsumer.address);
  console.log("LotteryManagement contract address: ", lotteryManagement.address);

  //Set lottery management for consumer
  await lotteryVRFConsumer.connect(deployer).setLotteryManagement(lotteryManagement.address);
  console.log("Set lottery management for consumer successfully!");

  // For each contract, pass the deployed contract and name to this function to save a copy of the contract ABI and address to the front end.
  saveFrontendFiles(nft, "NFT");
  saveFrontendFiles(marketplace, "Marketplace");
  saveFrontendFiles(lotteryVRFConsumer, "LotteryVRFConsumer");
  saveFrontendFiles(lotteryManagement, "LotteryManagement");

  await createSampleData(nft, marketplace, lotteryManagement, deployer);
}

async function createSampleData(nft, marketplace, lotteryManagement, deployer) {
  for (let item of items) {
    await nft.connect(deployer).mint(item);
    console.log("Mint NFT ", item);
  }

  await nft.connect(deployer).setApprovalForAll(marketplace.address, true);
  const listingPrice = ethers.utils.parseEther("0.0001");
  for (let i = 0; i < items.length / 2; i++) {
    await marketplace.listItem(nft.address, i + 1, listingPrice);
    console.log("Selling NFT ", i + 1);
  }

  await nft.connect(deployer).setApprovalForAll(lotteryManagement.address, true);
  await lotteryManagement.createNewLottery(9, ethers.utils.parseEther("0.00001"), moment().unix(), moment().add(5, "minutes").unix());

  console.log("Create new lottery successfully!");
}

function saveFrontendFiles(contract, name) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../../frontend/contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
