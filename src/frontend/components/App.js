import './App.css';
import Navigation from './Navbar';
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import NFTAbi from "../contractsData/NFT.json";
import NFTAddress from "../contractsData/NFT-address.json";
import MarketplaceAbi from "../contractsData/Marketplace.json";
import MarketplaceAddress from "../contractsData/Marketplace-address.json";
import LotteryManagementAbi from "../contractsData/LotteryManagement.json";
import LotteryManagementAddress from "../contractsData/LotteryManagement-address.json";
import Home from './Home';
import Create from './Create';
import Inventory from './Inventory';
import Selling from './Selling';
import CreateLottery from './CreateLottery';
import Lottery from './Lottery';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import { Toast, ToastContainer } from "react-bootstrap";
import React from 'react';
import moment from "moment";
 
function App() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [marketplace, setMarketplace] = useState(null);
  const [lotteryManagement, setLotteryManagement] = useState(null);
  const [nft, setNFT] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastBody, setToastBody] = useState("");
  const toggleShowToast = () => setShowToast(!showToast);

  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ 
      method: "eth_requestAccounts"
    });
    setAccount(accounts[0]);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    loadContracts(signer, accounts[0]);
  }

  const loadContracts = async (signer, account) => {
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer);
    setNFT(nft);
    
    const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer);
    setMarketplace(marketplace);

    const lotteryManagement = new ethers.Contract(LotteryManagementAddress.address, LotteryManagementAbi.abi, signer);
    setLotteryManagement(lotteryManagement);

    marketplace.on("NFTPurchased", (itemId, nft, tokenId, price, creator, seller, buyer) => {
      if (seller.toLowerCase() == account) {
        console.log("NFTPurchased Event", {itemId, nft, tokenId, price, creator, seller, buyer});
        setToastBody(`NFT with ID ${tokenId} was bought buy ${account.slice(0, 5) + "..." + account.slice(account.length-4, account.length)}`);
        setToastTitle(`NFT Sold`);
        setShowToast(true);

        setTimeout(() => {
          setShowToast(false);
        }, 10000);
      }
    }); 

    nft.on("Transfer", (from, to, tokenId) => {
      if (to.toLowerCase() == account) {
        console.log("NFT Transfer Event", {from, to, tokenId});
        setToastBody(`You receive new NFT ID ${tokenId} from ${from.slice(0, 5) + "..." + from.slice(from.length-4, from.length)}`);
        setToastTitle(`New NFT Receive`);
        setShowToast(true);
      }
    });

    lotteryManagement.on("NewLotteryCreated", (lotteryCount, tokenId, ticketPrice, startTime, endTime) =>{
      console.log("NewLotteryCreated Event", {lotteryCount, tokenId, ticketPrice, startTime, endTime});
      setToastBody(`New lottery start at ${moment.unix(startTime).format("MM/DD/YYYY HH:mm:ss")}`);
      setToastTitle(`New NFT Lottery`);
      setShowToast(true);
    });

    lotteryManagement.on("LotteryWinnerChoosed", (lotteryId, winner) =>{
      if (winner.toLowerCase() == account) {
        console.log("LotteryWinnerChoosed Event", {lotteryId, winner});
        setToastBody(`Lottery ${lotteryId} result is available, check now!`);
        setToastTitle(`NFT Lottery Result`);
        setShowToast(true);
      }
    });

    setLoading(false);
  }

  useEffect(() => {
      web3Handler()
  }, []);

  return (
    <BrowserRouter>
      <div className='App'>
        <Navigation web3Handler={web3Handler} account={account}/>
        {
          loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
            </div>
          ) : (
            <div>
              
              <Routes>
                <Route path="/" element={<Home marketplace={marketplace} nft={nft}/>} />
                <Route path="/create" element={<Create marketplace={marketplace} nft={nft} />}/>
                <Route path="/inventory" element={<Inventory marketplace={marketplace} nft={nft} account={account}/>}/>
                <Route path="/selling" element={<Selling marketplace={marketplace} nft={nft}/>}/>
                <Route path="/lottery" element={<Lottery lotteryManagement={lotteryManagement} nft={nft} account={account}/>}/>
                <Route path="/create-lottery" element={<CreateLottery lotteryManagement={lotteryManagement} nft={nft} account={account}/>}/>
              </Routes>
            </div>
          )
        }
        <ToastContainer className="p-3" position="bottom-end">
        <Toast show={showToast} onClose={toggleShowToast}>
          <Toast.Header>
            <strong className="me-auto">{toastTitle}</strong>
            <small>Now</small>
          </Toast.Header>
          <Toast.Body>{toastBody}</Toast.Body>
        </Toast>
        </ToastContainer>
     </div>
    </BrowserRouter>
  );
}

export default App;
