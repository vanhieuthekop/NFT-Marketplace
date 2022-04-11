import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react'
import { Col, Row, Button, Card, Table, Modal } from 'react-bootstrap';
import moment from "moment";

const Lottery = ({ lotteryManagement, nft, account }) => {
  const [loading, setLoading] = useState(true);
  const [lotteries, setLotteries] = useState([]);
  const [showlModal, setShowlModal] = useState(false);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState([]);
  const loadLotteryItems = async () => {
    const totalLottery = await lotteryManagement.totalLottery();
    const list = [];
    for (let i = 1; i <= totalLottery; i++) {
      const lottery = await lotteryManagement.getLottery(i);
      const URI = await nft.tokenURI(lottery.tokenId.toNumber());
      const response = await fetch(replaceIpfsPrefix(URI));
      const tokenToLottery = await response.json();

      list.push({
        token: tokenToLottery,
        lotteryId: lottery.lotteryId.toNumber(),
        ticketPrice: lottery.ticketPrice,
        tokenId: lottery.tokenId.toNumber(),
        winner: lottery.winner,
        state: lottery.state,
        startTime: moment.unix(lottery.startTime).format("MM/DD/YYYY HH:mm:ss"),
        endTime: moment.unix(lottery.endTime).format("MM/DD/YYYY HH:mm:ss"),
        endTimeInUnix: lottery.endTime.toNumber()
      });
    }

    console.log("List lotteries ", list);
    setLoading(false);
    setLotteries(list);
  }

  const LotteryStatus = ["Active", "Awarding", "Ended"];

  const loadLotteryPlayers = async (lotteryId) => {
    const lottery = await lotteryManagement.getLottery(lotteryId);
    setPlayers(lottery.players);
    setWinner(lottery.winner);
    setShowlModal(true)
  }

  const handleCloseModal = () => setShowlModal(false);
  const handleShowlModal = (e) => {
    loadLotteryPlayers(e.target.value);
  };

  const handleBuyTicket = async(e) => {
    const lottery = JSON.parse(e.target.value);
    await lotteryManagement.buyTicket(lottery.lotteryId, {
      value: lottery.ticketPrice
    });
  }

  const isRunning = (lottery) => {
    return (lottery.endTimeInUnix > moment().unix());
  }

  const handleWithdraw = async (e) => {
    const lottery = JSON.parse(e.target.value);
    await lotteryManagement.withdrawNFT(lottery.lotteryId);
  }

  const replaceIpfsPrefix = (url) => { return url.replace(/^ipfs:\/\//, "https://nftstorage.link/ipfs/") }

  useEffect(() => {
    loadLotteryItems()
  }, []);

  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )

  return (
    <div className="flex justify-center">
      {lotteries.length > 0 ?
        <div className="px-5 py-3 container">
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {lotteries.map((lottery) => {
              const token = lottery.token;
              return (
                <Col key={lottery.lotteryId} className="overflow-hidden">
                  <Card style={{ width: '18rem' }}>
                    <Card.Img variant="top" src={replaceIpfsPrefix(token.image)} ></Card.Img>
                    <Card.Title>Lottery: {token.name} NFT</Card.Title>
                    <Table>
                        <tbody>
                          <tr>
                            <th>Ticket Price</th>
                            <td>{ethers.utils.formatEther(lottery.ticketPrice)} ETH</td>
                          </tr>
                          <tr>
                            <th>Start Time</th>
                            <td>{lottery.startTime}</td>
                          </tr>
                          <tr>
                            <th>End Time</th>
                            <td>{lottery.endTime}</td>
                          </tr>
                          <tr>
                            <th>Status</th>
                            <td>{lottery.endTimeInUnix < moment().unix() ? "Ended" : LotteryStatus[lottery.state]}</td>
                          </tr>
                        </tbody>
                      </Table>
                    <Card.Footer>
                      <Button style={{ margin: "0 1rem" }} 
                        value={JSON.stringify(lottery)} 
                        onClick={isRunning(lottery) ? handleBuyTicket : handleWithdraw} 
                        disabled={lottery.endTimeInUnix < moment().unix() && account.toLowerCase() != lottery.winner.toLowerCase() } > 
                        {isRunning(lottery) ? "Buy a ticket" : "Withdraw" }
                      </Button>
                      <Button onClick={handleShowlModal} value={lottery.lotteryId} > More Info </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              );
             })}
          </Row>
          <Modal show={showlModal} onHide={handleCloseModal}>
              <Modal.Header closeButton>
                <Modal.Title>List players</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Table>
                  <tbody>
                    {
                      players.map((player) => (
                        <tr key={player}>
                          <td>{winner == player ? (<b>Winner {player} </b>) : player}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </Table>
              </Modal.Body>
          </Modal>
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No items to display</h2>
          </main>
        )}
    </div>
  )
}

export default Lottery