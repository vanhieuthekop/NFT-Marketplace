import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Button, Modal, Form } from 'react-bootstrap'

export default function MyListedItems({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true);
  const [myTokens, setMyTokens] = useState([]);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [price, setPrice] = useState(0);
  const [transferAddress, setTransferAddress] = useState(0);
  const [tokenId, setTokenId] = useState(0);
  const [isOperator, setIsOperator] = useState(false);

  const handleCloseSellModal = () => setShowSellModal(false);
  const handleShowSellModal = (e) => {
    setTokenId(e.target.value);
    setShowSellModal(true)
  };

  const handleCloseTransferModal = () => setShowTransferModal(false);
  const handleShowTransferModal = (e) => {
    setTokenId(e.target.value);
    setShowTransferModal(true)
  };

  const loadItems = async () => {
    const tokenIds = await nft.getMyTokenIds();
    const tokens = [];
    for (let tokenId of tokenIds) {
      const URI = await nft.tokenURI(tokenId);
      const response = await fetch(replaceIpfsPrefix(URI));
      const myToken = await response.json();
      tokens.push({ ...myToken, tokenId: tokenId.toNumber() });

    }
    const isOperator = await isApproveForAll();
    console.log("My NFTs: ", tokens);
    setIsOperator(isOperator);

    setLoading(false);
    setMyTokens(tokens);
  }
  const replaceIpfsPrefix = (url) => { return url.replace(/^ipfs:\/\//, "https://nftstorage.link/ipfs/") }

  useEffect(() => {
    loadItems()
  }, [])

  const handleSellNFT = async () => {
    try {
      const listingPrice = ethers.utils.parseEther(price.toString());
      const response = await marketplace.listItem(nft.address, tokenId, listingPrice);
      console.log("List NFT successfully ", response);
      
      setShowSellModal(false)
    } catch (error) {
      console.log("[Error] List NFT to market error ", error.stack);
    }
  }

  const handleTransferNFT = async () => {
    try {
      await nft.transferFrom(account, transferAddress, tokenId);
      console.log("TEST ", account, transferAddress, tokenId);
      
      setShowTransferModal(false)
    } catch (error) {
      console.log("[Error] Transfer to NFT error", error.stack);
    }
  }

  const approveOperator = async () => {
    await nft.setApprovalForAll(marketplace.address, true);
  }

  const isApproveForAll = async () => {
    return await nft.isApprovedForAll(account, marketplace.address);
  }

  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )

  return (
    <div className="flex justify-center">
      {myTokens.length > 0 ?
        <div className="px-5 py-3 container">
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {myTokens.map((token) => (
              <Col key={token.tokenId} className="overflow-hidden">
                <Card style={{ width: '17rem' }}>
                  <Card.Img variant="top" src={replaceIpfsPrefix(token.image)} ></Card.Img>
                  <Card.Body>
                    <Card.Title>{token.name}</Card.Title>
                    <Card.Text>{token.description}</Card.Text>
                    <Card.Text>
                      Token Id: {token.tokenId}
                    </Card.Text>
                  </Card.Body>
                  <Card.Footer>
                    {
                      isOperator ? <Button style={{ margin: "0 1rem" }}  onClick={handleShowSellModal} value={token.tokenId}> Sell </Button> 
                        : <Button style={{ margin: "0 1rem" }}  onClick={approveOperator} > Approve </Button>
                    }
                    <Button style={{ margin: "0 1rem" }}  onClick={handleShowTransferModal} value={token.tokenId}> Transfer </Button> 
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
          <Modal show={showSellModal} onHide={handleCloseSellModal}>
              <Modal.Header closeButton>
                <Modal.Title>Sell NFT</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Enter price in ETH:</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder='price'
                      autoFocus
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseSellModal}>Close</Button>
                <Button variant="primary" onClick={handleSellNFT}>Sell</Button>
              </Modal.Footer>
          </Modal>

          <Modal show={showTransferModal} onHide={handleCloseTransferModal}>
              <Modal.Header closeButton>
                <Modal.Title>Transfer NFT</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Enter address:</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder='address'
                      autoFocus
                      onChange={(e) => setTransferAddress(e.target.value)}
                    />
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseTransferModal}>Close</Button>
                <Button variant="primary" onClick={handleTransferNFT}>Transfer</Button>
              </Modal.Footer>
          </Modal>
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No items to display</h2>
          </main>
        )}
    </div>
  );
}