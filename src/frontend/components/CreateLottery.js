import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react'
import { Col, Row, Form, Button } from 'react-bootstrap';

const CreateLottery = ({ lotteryManagement, nft, account }) => {
  const [tokenId, setTokenId] = useState(0);
  const [ticketPrice, setTicketPrice] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isOperator, setIsOperator] = useState(false);

  const createNewLottery = async () => {
    const tickPriceInWei = ethers.utils.parseEther(ticketPrice);
    if (tokenId && ticketPrice && startTime && endTime) {
      await lotteryManagement.createNewLottery(
        tokenId, tickPriceInWei, startTime, endTime
      )
    }
  }

  const handleTimeInput = async (e, setTime) => {
    const timeInput = new Date(e.target.value);
    const unixTimestamp = (timeInput.getTime() / 1000).toFixed(0);

    setTime(unixTimestamp);
  }

  const isApproveForAll = async () => {
    const isOperator = await nft.isApprovedForAll(account, lotteryManagement.address);
    setIsOperator(isOperator);
  }

  const approveOperator = async () => {
    await nft.setApprovalForAll(lotteryManagement.address, true);
  }

  useEffect(async () => {
    isApproveForAll();
  });

  return (
    <div className='container-fluid mt-5'>
      <div className='row'>
      <main  role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className='content mx-auto'>
            <Row className="g-4">
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm="2">
                  Token Id
                </Form.Label>
                <Col sm="10">
                  <Form.Control
                    onChange={(e) => setTokenId(e.target.value)}
                    size="lg"
                    required
                    type="number"
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm="2">
                  Ticket price
                </Form.Label>
                <Col sm="10">
                  <Form.Control
                    onChange={(e) => setTicketPrice(e.target.value)}
                    size="lg"
                    required
                    type="text"
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm="2">
                  Start time
                </Form.Label>
                <Col sm="10">
                  <Form.Control
                    onChange={(e) => { handleTimeInput(e, setStartTime) }}
                    size="lg"
                    required
                    type="datetime-local"
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm="2">
                  End time
                </Form.Label>
                <Col sm="10">
                  <Form.Control
                    onChange={(e) => { handleTimeInput(e, setEndTime) }}
                    size="lg"
                    required
                    type="datetime-local"
                  />
                </Col>
              </Form.Group>

              <div className="d-grid px-0">
                {isOperator
                  ? <Button onClick={createNewLottery} variant="primary" size="lg" style={{width: "30%", margin: "0 0 0 30%"}}>
                      Create new lottery game
                    </Button>
                  : <Button onClick={approveOperator} variant="primary" size="lg" style={{width: "30%", margin: "0 0 0 30%"}}>
                      Approve Lottery Operator
                    </Button>
                }
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CreateLottery