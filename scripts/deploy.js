const { ethers } = require("hardhat");
// 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  const CrowdFund = await ethers.getContractFactory("CrowdFund");
  const crowdFund = await CrowdFund.deploy();

  await crowdFund.waitForDeployment();
  console.log(`CrowdFund contract deployed to: ${crowdFund.target}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
