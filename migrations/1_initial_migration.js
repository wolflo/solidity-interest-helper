var Migrations = artifacts.require("./Migrations.sol");
var InterestHelper = artifacts.require("./InterestHelper.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(InterestHelper);
};
