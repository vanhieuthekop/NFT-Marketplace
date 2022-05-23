import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers';
import { Row, Col, Card, Button } from 'react-bootstrap';

const Home = ({ marketplace, nft }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const loadMarketItems = async () => {
    const itemsFromMarket = await marketplace.getListingItems();
    const items = [];
    for (let item of itemsFromMarket) {
      if (item.tokenId.toNumber()) {
        const URI = await nft.tokenURI(item.tokenId);
        const response = await fetch(replaceIpfsPrefix(URI));
        const itemData = await response.json();
        items.push({
          ...itemData, 
          price: item.price, 
          tokenId: item.tokenId, 
          seller: item.seller, 
          itemId: item.itemId
        });
      }
    }

    console.log("List items", items);

    setLoading(false);
    setItems(items);
  }
  const replaceIpfsPrefix = (url) => { return url.replace(/^ipfs:\/\//, "https://nftstorage.link/ipfs/") }

  useEffect(() => {
    loadMarketItems();
  }, []);

  const handleBuyItem = async (e) => {
    let item = e.target.value;
    item = JSON.parse(item);
    await marketplace.purchaseItem(item.itemId, { value: item.price });

    loadMarketItems();
  }

  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )
  return (
    <div className='flex justify-center'>
      {
        items.length > 0 ?
          <div className='px-5 container'>
            <Row xs={1} md={2} lg={4} className="g-4 py-5">
              {
                items.map((item, index) => (
                  <Col key={index} className="overflow-hidden">
                    <Card style={{ width: '13rem' }}>
                      <Card.Img variant='top' src={replaceIpfsPrefix(item.image)} />
                      <Card.Footer>
                        <div className='d-grid'>
                        <Card.Title>{item.name}#{item.tokenId.toNumber()}</Card.Title>
                          <Button value={JSON.stringify(item)} onClick={handleBuyItem}>
                            Buy for {ethers.utils.formatEther(item.price)} ETH
                          </Button>
                        </div>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))
              }
            </Row>
          </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No items to display</h2>
          </main>
        )
      }
    </div>
  )
}

export default Home