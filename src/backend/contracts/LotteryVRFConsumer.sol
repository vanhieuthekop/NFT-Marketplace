//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "./LotteryManagement.sol";

contract LotteryVRFConsumer is VRFConsumerBaseV2 {
  VRFCoordinatorV2Interface COORDINATOR;
  uint64 subscriptionId;
  address vrfCoordinator = 0x6168499c0cFfCaCD319c818142124B7A15E857ab;
  bytes32 keyHash = 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;
  uint32 callbackGasLimit = 300000;
  uint16 requestConfirmations = 3;
  uint32 numWords = 2;
  address owner;
  LotteryManagement public lotteryManagement;

  constructor(uint64 _subscriptionId) VRFConsumerBaseV2(vrfCoordinator) {
    COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
    owner = msg.sender;
    subscriptionId = _subscriptionId;
  }

  function setLotteryManagement(LotteryManagement _lotteryManagement) external {
    lotteryManagement= _lotteryManagement;
  }
  
  mapping(uint256 => uint256[]) public requestIdToRandomWords;
  mapping(uint256 => uint256) public requestIdToLottery;

  function requestRandomPlayerIndex(uint256 lotteryId) external returns (uint256) {
    require(msg.sender == address(lotteryManagement), "Only lottery management can request random number!");
    uint256 requestId = COORDINATOR.requestRandomWords(
      keyHash, subscriptionId, requestConfirmations, callbackGasLimit, numWords
    );
    requestIdToLottery[requestId] = lotteryId;
    
    return requestId;
  }

  function fulfillRandomWords(
    uint256 requestId,
    uint256[] memory randomWords
  ) internal override {
    requestIdToRandomWords[requestId] = randomWords;
    uint256 lotteryId = requestIdToLottery[requestId];
    lotteryManagement.callbackSetWinner(randomWords[0], lotteryId);
  }

}