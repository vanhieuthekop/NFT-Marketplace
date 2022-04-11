//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol" ;
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  mapping(uint256 => address) creators;

  constructor() ERC721("Dating", "DAT") {}

  function mint(string memory _tokenURI) external returns(uint256) {
    _tokenIds.increment();

    uint256 newTokenId = _tokenIds.current();

    _mint(msg.sender, newTokenId);
    _setTokenURI(newTokenId, _tokenURI);
    creators[newTokenId] = msg.sender;

    return newTokenId;
  }

  function getCreator(uint256 _tokenId) public view returns(address) {
    return creators[_tokenId];
  }

  function getCurrentTokenId() public view returns(uint256) {
    return _tokenIds.current();
  }

  function getMyTokenIds() public view returns(uint256[] memory tokenIds) {
    tokenIds = new uint256[](balanceOf(msg.sender));
    uint256 currentIndex = 0;
    uint256 totalTokens = _tokenIds.current();
    for (uint256 i = 1; i <= totalTokens; i++) {
      if (ownerOf(i) == msg.sender) {
        tokenIds[currentIndex] = i;
        currentIndex++;
      }
    }    
  }

}