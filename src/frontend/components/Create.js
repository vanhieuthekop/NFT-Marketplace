import React, { useState } from 'react'
import { Row, Form, Button } from 'react-bootstrap';
import { NFTStorage } from 'nft.storage';
const client = new NFTStorage({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDcyMzRlOTFBMzNjNEUyZDQ2NzEwQzgzOTVFMjFGMThGRWIzMDE5OTUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY0OTA2MjQ3MjI4NCwibmFtZSI6Ik1hcmtldHBsYWNlIn0.xLYnyWKTZY3Egaj-LyI052F_fTci2pDHU9phRzyx5fU' })

const Create = ({ marketplace, nft }) => {
  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [listFiles, setListFiles] = useState("");

  const createNFT = async () => {
    await uploadToStorageAndMint({
      name, description, image
    });
  }

  const uploadToStorageAndMint = async ({ name, description, image}) => {
    try {
      const metadata = await client.store({
        name:name,
        description: description,
        image: image
      });

      console.log("NFT Storage metadata: ", metadata);
      const response = await nft.mint(metadata.url);
      console.log("Mint response ", response);

    } catch (error) {
      console.log("[Error] Update to NFT Storage error: ", error.stack);
    }
  }

  const handleCreateMultipleNFTForTest = async () => {
    for (let file of listFiles) {
      await uploadToStorageAndMint({
        name: file.name.replace(".png", ""), 
        description: file.name.replace(".png", "") + " description" , 
        image: file
      });
    }
  }

  return (
    <div className='container-fluid mt-5'>
      <div className='row'>
        <main  role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className='content mx-auto'>
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={(e) => setImage(e.target.files[0])}
              />
              <Form.Control
                onChange={(e) => setName(e.target.value)}
                size="lg"
                required
                type="text"
                placeholder="Name"
              />

              <Form.Control
                onChange={(e) => setDescription(e.target.value)}
                size="lg"
                required
                type="text"
                placeholder="Description"
              />

              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Mint new NFT
                </Button>
              </div>
            </Row>
          </div>
          <div style={{ margin : "1rem 0 0 0"}}>
            <h3>For test</h3>
            <Form.Control id="formControlsFile"
              type="file"
              multiple
              label="File"
              onChange={(e) => setListFiles(e.target.files)} />
            <Button onClick={handleCreateMultipleNFTForTest} variant="primary" size="lg" style={{ margin : "1rem 0 0 0"}}>
              Create nfts from multiple files to test
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Create