require("@nomiclabs/hardhat-waffle");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const ethers = hre.ethers;
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  solidity: "0.8.4",
  paths: {
    artifacts: "./src/backend/artifacts",
    sources: "./src/backend/contracts",
    cache: "./src/backend/cache",
    tests: "./src/backend/test"
  },
  networks: {
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/CLqZNnUrU6M_K7vs8q9e-uhaHhcBuZzS",
      accounts: ["1aa11f8789b5ac3a2427fb565eb450efc144465370a4f0e101b0e4e893145add", "52d73325f1acd0471ecd5c669c9a74343256f64e537c1be36581008e84c08138", "3419da6e8518e9325e819e977564e68f01db128a48b5fdeee677f4873b9f6abe", "48048c7cbb876154d96129fd3a7ec62b63e6e5cbd5174358d44d3fd4b462a3df"],
      gas: 2100000,
      gasPrice: 8000000000
    }
  }
};
