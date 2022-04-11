import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Row, Col, Card, Button } from 'react-bootstrap'; 

const Selling = ({ marketplace, nft }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const loadSellingItems = async () => {
    const sellingItems = await marketplace.getMySellingItems();
    console.log("List selling items", sellingItems);
    const items = [];
    for (let item of sellingItems) {
      const URI = await nft.tokenURI(item.tokenId);
      const response = await fetch(replaceIpfsPrefix(URI));
      const itemData = await response.json();
      items.push({
        ...itemData,
        price: item.price,
        tokenId: item.tokenId,
        itemId: item.itemId
      });
    }

    setLoading(false);
    setItems(items);
  }

  const replaceIpfsPrefix = (url) => { return url.replace(/^ipfs:\/\//, "https://nftstorage.link/ipfs/") }

  const handleDelistItem = async (e) => {
    const itemId = e.target.value;
    await marketplace.delistItem(itemId);
  }

  useEffect(() => {
    loadSellingItems();
  }, []);

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
                    <Card style={{ width: '15rem' }}>
                      <Card.Img variant='top' src={replaceIpfsPrefix(item.image)} />
                      <Card.Body color="secondary">
                          <Card.Title>{item.name}</Card.Title>
                          <Card.Text>
                            Token Id: {item.tokenId.toNumber()}
                            <br/>
                            Selling Price: {ethers.utils.formatEther(item.price)} ETH
                          </Card.Text>
                      </Card.Body>
                      <Card.Footer>
                        <div className='d-grid'>
                          <Button value={item.itemId} onClick={handleDelistItem}>
                            Delist item
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

export default Selling