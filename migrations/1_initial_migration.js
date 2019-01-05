var Migrations = artifacts.require("./Migrations.sol");
var Interest = artifacts.require("./Interest.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Interest);
};
