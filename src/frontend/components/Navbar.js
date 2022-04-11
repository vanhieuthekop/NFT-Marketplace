import React from 'react'
import { Link } from "react-router-dom";
import { Navbar, Nav, Button, Container } from "react-bootstrap";
import './App.css';

const Navigation = ({ web3Handler, account }) => {
  return (
    <Navbar expand="lg" bg="dark" variant="dark">
      <Container>
        <Navbar.Brand
          href="">
            &nbsp; NFT Marketplace
        </Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link as={ Link } to="/" >Home</Nav.Link>
          <Nav.Link as={ Link } to="/create" >Create NFT</Nav.Link>
          <Nav.Link as={ Link } to="/inventory" >Inventory</Nav.Link>
          <Nav.Link as={ Link } to="/selling" >Selling</Nav.Link>
          <Nav.Link as={ Link } to="/lottery">Lottery</Nav.Link>
          <Nav.Link as={ Link } to="/create-lottery">Create Lottery</Nav.Link>
        </Nav>
        <Nav>
          {
            account ? (
              <Nav.Link
                href={`https://etherscan.io/address/${account}`}
                target="_blank"
                rel="nooperner noreferrer"
                className="button nav-button btn-sm mx-4">
                <Button variant="outline-light">
                    {account.slice(0, 5) + "..." + account.slice(account.length-4, account.length)}
                  </Button>
              </Nav.Link>
            ) : (
              <Button onClick={web3Handler} variant="outline-light">Connect Wallet</Button>
            )
          }
        </Nav>
      </Container>
    </Navbar>
  )
}

export default Navigation