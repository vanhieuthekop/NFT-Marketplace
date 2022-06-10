//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./NFT.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./LotteryVRFConsumer.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

contract LotteryManagement is KeeperCompatible{
  using Counters for Counters.Counter;
  Counters.Counter private _lotteryCount;
  address payable public owner;
  NFT nft;
  LotteryVRFConsumer vrfLotteryConsumer;

  struct LotteryItem {
    uint256 lotteryId;
    uint256 tokenId;
    uint256 ticketPrice;
    uint256 startTime;
    uint256 endTime;
    LotteryState state;
    uint256 vrfRequestId;
    address[] players;
    address winner;
  }

  enum LotteryState { Active, Awarding, Inactive }

  mapping(uint256 => LotteryItem) public listLotteries;
  mapping(uint256 => mapping(address => bool)) public lotteryBuyers;

  modifier onlyOnwer {
    require(owner == msg.sender, "Only owner!");
    _;
  }

  modifier onlyInPlayingTime(uint256 lotteryId) {
    require(listLotteries[lotteryId].startTime <= block.timestamp, "The lottery hasn't start yet");
    require(listLotteries[lotteryId].endTime >= block.timestamp, "The lottery ended");
    _;
  }

  modifier onlyInAwardingState(uint256 lotteryId) {
    require(listLotteries[lotteryId].state <= LotteryState.Awarding, "The lottery not in awarding state");
    _;
  }

  event NewLotteryCreated (
    uint256 lotteryId,
    uint256 tokenId,
    uint256 ticketPrice,
    uint256 startTime,
    uint256 endTime
  );

  event TicketBought (
    uint256 lotteryId,
    address buyer
  );

  event LotteryWinnerChoosed (
    uint256 lotteryId,
    address winner
  );

  constructor(NFT _nft, LotteryVRFConsumer _vrfLotteryConsumer) {
    owner = payable(msg.sender);
    nft = _nft;
    vrfLotteryConsumer = _vrfLotteryConsumer;
  }

  function createNewLottery(
    uint256 _tokenId,
    uint256 _ticketPrice,
    uint256 _startTime,
    uint256 _endTime
  ) external onlyOnwer{
    require(nft.ownerOf(_tokenId) == msg.sender, "Not owner of token!");
    _lotteryCount.increment();
    uint256 lotteryCount = _lotteryCount.current();
    listLotteries[lotteryCount] = LotteryItem(
      lotteryCount,
      _tokenId,
      _ticketPrice,
      _startTime,
      _endTime,
      LotteryState.Active,
      0,
      new address[](0),
      payable(address(0))
    );

    nft.transferFrom(msg.sender, address(this), _tokenId);

    emit NewLotteryCreated(lotteryCount, _tokenId, _ticketPrice, _startTime, _endTime);
  }

  function buyTicket(uint256 lotteryId) external payable onlyInPlayingTime(lotteryId) {
    require(!lotteryBuyers[lotteryId][msg.sender], "User already got ticket of this lottery");
    LotteryItem storage lotteryItem = listLotteries[lotteryId];
    require(msg.value >= lotteryItem.ticketPrice, "Not enough ETH to buy ticket!");
    
    lotteryItem.players.push(msg.sender);
    owner.transfer(msg.value);
    lotteryBuyers[lotteryId][msg.sender] = true;

    emit TicketBought(lotteryId, msg.sender);
  }

  function withdrawNFT(uint256 lotteryId) external onlyInAwardingState(lotteryId) {
    LotteryItem storage lotteryItem = listLotteries[lotteryId];
    require((lotteryItem.winner != address(0) && lotteryItem.winner == msg.sender)
              || (lotteryItem.winner == address(0) && msg.sender == owner)
              , "Only winner or owner(When no winner) can withdraw NFT");
    nft.transferFrom(address(this), lotteryItem.winner, lotteryItem.tokenId);

    lotteryItem.state = LotteryState.Inactive;
  }

  function requestPickWinnerLottery(uint256 lotteryId) internal {
    LotteryItem storage lotteryItem = listLotteries[lotteryId];
    lotteryItem.vrfRequestId = vrfLotteryConsumer.requestRandomPlayerIndex(lotteryId);
    lotteryItem.state = LotteryState.Awarding;
  }

  function callbackSetWinner(uint256 randomNumber, uint256 lotteryId) external {
    require(msg.sender == address(vrfLotteryConsumer), "Only consumer can call callback set winner!");
    LotteryItem storage lotteryItem = listLotteries[lotteryId];
    require(lotteryItem.players.length > 0, "No one plays the lottery");
    uint256 randomIndex = randomNumber % lotteryItem.players.length;
    lotteryItem.winner = lotteryItem.players[randomIndex];
 
    emit LotteryWinnerChoosed(lotteryId, lotteryItem.winner);
  }

  function checkUpkeep(bytes calldata) external view override returns(bool upkeepNeeded, bytes memory performData) {
    uint256 lotteryCount = _lotteryCount.current();
    for (uint i = 1; i <= lotteryCount; i++){
      if (listLotteries[i].state == LotteryState.Active && listLotteries[i].endTime < block.timestamp) {
        upkeepNeeded = true;
        performData = abi.encode(i);
        break;
      }
    }
  }

  function performUpkeep(bytes calldata performData) external override {
    uint256 lotteryId = abi.decode(performData, (uint256));
    requestPickWinnerLottery(lotteryId);
  }

  function getPlayers(uint256 lotteryId) external view returns(address[] memory) {
    return listLotteries[lotteryId].players;
  }

  function getLottery(uint256 lotteryId) external view returns(LotteryItem memory) {
    return listLotteries[lotteryId];
  }

  function totalLottery() external view returns(uint256) {
    return _lotteryCount.current();
  }
}