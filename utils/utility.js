const {Contract} = require('ethers');
const {localSetup, kovanSetup} = require("../utils/setup.js");


// var str = new Array(32).join('0');

// console.log(str+"c89ee5e0590a4f4c8017bae5f9724fcf");

/**
 * @param {string} contract - contractName
 * @param {string} net - "local" | "kovan"
 */
function getContract(contract, net, deployedaddr = "") {
  var networkId;
  var signer;
  switch (net) {
    case "local":
      networkId = localSetup.networkId;
      signer = localSetup.signer;
      break;
    case "kovan":
      networkId = kovanSetup.networkId;
      signer = kovanSetup.signer;
      break;
    //add more net
    default:
      throw "unsupported net"
  }
  const contractJson = require("../build/contracts/" + contract + ".json");
  if(deployedaddr == ""){
    deployedaddr = contractJson["networks"][networkId.toString()]["address"];
  }
  return new Contract(deployedaddr, contractJson.abi, signer);
}

/**
 * @param {string} transactionHash - txHash
 * @param {string} net - "local" | "kovan"
 */
async function checkTransactionConfirmed(transactionHash, net) {
  var txReceipt;
  switch (net) {
    case "local":
      txReceipt = await kovanSetup.jsonProvider.getTransactionReceipt(transactionHash);
      break;
    case "kovan":
      txReceipt = await localSetup.jsonProvider.getTransactionReceipt(transactionHash);
      break;
    default:
      throw "unsupported net"
  }
  
  if (txReceipt && txReceipt.blockNumber) {
      return txReceipt;
  }

}

module.exports = {getContract, checkTransactionConfirmed}
