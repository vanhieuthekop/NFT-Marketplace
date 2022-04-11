//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./NFT.sol";

contract Marketplace is ReentrancyGuard {
  //Account that receives fees from uer buying and selling nft
  address payable public immutable owner; 
  uint8 public immutable serviceFeePercent;
  uint8 public immutable creatorFeePercent;
  using Counters for Counters.Counter;
  Counters.Counter private _itemCount;
  Counters.Counter private _itemSoldCount;

  struct MarketItem {
    uint256 itemId;
    NFT nft;
    uint256 tokenId;
    uint256 price;
    address payable seller;
    ItemState itemState;
  }

  enum ItemState { LISTED, DELISTED, SOLD }

  mapping(uint256 => MarketItem) public listItems;
  mapping(address => uint256) private _sellerItemCount;

  event NewNFTListed (
    uint256 itemId,
    address indexed nft,
    uint256 tokenId,
    uint256 price,
    address indexed seller
  );

  event ItemDelisted (
    address indexed nft,
    uint256 tokenId,
    address indexed seller
  );

  event NFTPurchased (
    uint256 itemId,
    address indexed nft,
    uint256 tokenId,
    uint256 price,
    address creator,
    address indexed seller,
    address indexed buyer
  );

  constructor(uint8 _serviceFeePercent, uint8 _creatorFeePercent) {
    owner = payable(msg.sender);
    serviceFeePercent = _serviceFeePercent;
    creatorFeePercent = _creatorFeePercent;
  }

  function listItem(NFT _nft, uint256 _tokenId, uint256 _price) external nonReentrant {
    require(_price > 0, "Price must be greater than zezo!");
    _nft.transferFrom(msg.sender, address(this), _tokenId);

    _itemCount.increment();
    uint256 itemCount = _itemCount.current();
    listItems[itemCount] = MarketItem (
      itemCount,
      _nft,
      _tokenId,
      _price,
      payable(msg.sender),
      ItemState.LISTED
    );

    _sellerItemCount[msg.sender]++;

    emit NewNFTListed(itemCount, address(_nft), _tokenId, _price, msg.sender);
  }

  function delistItem(uint256 _itemId) external nonReentrant {
    require(_itemId > 0 && _itemId <= _itemCount.current(), "Item doesn't exist.");

    MarketItem storage item = listItems[_itemId];
    require(item.seller == msg.sender, "Not owner of token!");

    item.nft.transferFrom(address(this), msg.sender, item.tokenId);

    item.itemState = ItemState.DELISTED;
    _sellerItemCount[msg.sender]--;

    emit ItemDelisted(address(item.nft), item.tokenId, msg.sender);
  }

  function purchaseItem(uint _itemId) external payable nonReentrant {
    require(_itemId > 0 && _itemId <= _itemCount.current(), "Item doesn't exist.");

    MarketItem storage item = listItems[_itemId];
    require(msg.sender != item.seller, "Item already sold.");
    require(msg.value >= item.price, "Not enough eth to purchase item");
    require(item.itemState != ItemState.SOLD, "Item already sold.");

    uint256 serviceFee;
    uint256 creatorFee;
    uint256 profitForSeller;
    (serviceFee, creatorFee, profitForSeller) = getFeeAndProfit(_itemId);
    address creatorAddress = item.nft.getCreator(item.tokenId);

    owner.transfer(serviceFee);
    payable(creatorAddress).transfer(creatorFee);
    item.seller.transfer(profitForSeller);

    item.itemState = ItemState.SOLD;

    item.nft.transferFrom(address(this), msg.sender, item.tokenId);

    _itemSoldCount.increment();
    _sellerItemCount[item.seller]--;
    
    emit NFTPurchased(_itemId, address(item.nft), item.tokenId, item.price, creatorAddress, item.seller, msg.sender);
  }

  function getListingItems() external view returns(MarketItem[] memory) {
    uint itemCount = _itemCount.current();
    uint currentIndex = 0;
    uint totalUnsoldItems = itemCount - _itemSoldCount.current();

    MarketItem[] memory listUnsoldItems = new MarketItem[](totalUnsoldItems);
    for (uint i = 1; i <= itemCount; i++) {
      if (listItems[i].itemState == ItemState.LISTED && listItems[i].seller != msg.sender) {
        listUnsoldItems[currentIndex] = listItems[i];
        currentIndex++;
      }
    }

    return listUnsoldItems;
  }

  function getMySellingItems() external view returns(MarketItem[] memory) {
    uint itemCount = _itemCount.current();
    uint currentIndex = 0;
    uint totalSellingItems = _sellerItemCount[msg.sender];

    MarketItem[] memory listUnsoldItems = new MarketItem[](totalSellingItems);
    for (uint i = 1; i <= itemCount; i++) {
      if (listItems[i].itemState == ItemState.LISTED && listItems[i].seller == msg.sender) {
        listUnsoldItems[currentIndex] = listItems[i];
        currentIndex++;
      }
    }

    return listUnsoldItems;
  }

  function getFeeAndProfit(uint _itemId) view public returns(uint256, uint256, uint256) {
    uint256 serviceFee = listItems[_itemId].price * serviceFeePercent / 100;
    uint256 creatorFee = listItems[_itemId].price * creatorFeePercent / 100;
    uint256 profitForSeller = listItems[_itemId].price - serviceFee - creatorFee;

    return (serviceFee, creatorFee, profitForSeller);
  }

  function getTotalItem() view public returns(uint256) {
    return _itemCount.current();
  }


}