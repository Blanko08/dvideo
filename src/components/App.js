import React, { Component } from 'react';
import DVideo from '../abis/DVideo.json'
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if(window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } else if(window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert('No ethereum browser is installed. Try it installing MetaMask.');
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3;

    // Cargar cuenta
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });

    // Recoger contrato
    const networkId = await web3.eth.net.getId();
    const netWorkData = DVideo.networks[networkId];
    if(netWorkData) {
      // Asignar contracto
      const dVideo = new web3.eth.Contract(DVideo.abi, netWorkData.address);
      this.setState({ dVideo });

      // Comprobar cantidad de videos
      const videosCount = await dVideo.methods.videoCount().call()
      this.setState({ videosCount });

      // Cargar videos ordenandolos de nuevo a viejo
      for(var i = videosCount; i>=1; i--) {
        const video = await dVideo.methods.videos(i).call();
        this.setState({
          videos: [...this.state.videos, video]
        });
      }

      // Selecciona el último video para ver por defecto.
      const latest = await dVideo.methods.videos(videosCount).call();
      this.setState({
        currentHash: latest.hash,
        currentTitle: latest.title
      });

      this.setState({ loading: false });
    }else {
      window.alert('DVideo contract not deployed to detected network.');
    }
  }

  //Get video
  captureFile = event => {
    event.preventDefault();
		
		const file = event.target.files[0];
		const reader = new window.FileReader();
		
		reader.readAsArrayBuffer(file);
		reader.onloadend = () => {
			this.setState({ buffer: Buffer(reader.result) });
			console.log('buffer', this.state.buffer);
		}
  }

  //Upload video
  uploadVideo = title => {
    console.log('Submitting video to IPFS...');
		
		// Add video to the IPFS
		ipfs.add(this.state.buffer, (error, result) => {
			console.log('IPFS result', result);
			if(error) {
				console.log(error);
				return;
			}
			
			this.setState({ loading: true });
			
			// Call smart contract uploadFile function 
			this.state.dVideo.methods.uploadVideo(result[0].hash, title).send({ from: this.state.account })
			.on('transactionHash', (hash) => {
				this.setState({ loading: false });
				window.location.reload();
			}).on('error', (e) => {
				window.alert('Error');
				this.setState({ loading: false });
			});
    });
  }

  //Change Video
  changeVideo = (hash, title) => {
    this.setState({ 
      'currentHash': hash, 
      'currentTitle': title
    });
  }

  constructor(props) {
    super(props)
    this.state = {
      buffer: null,
      account: '',
      dvideo: null,
      videos: [],
      currentHash: null,
      currentTitle: null,
      loading: false
    }
    
    this.captureFile = this.captureFile.bind(this);
    this.uploadVideo = this.uploadVideo.bind(this);
    this.changeVideo = this.changeVideo.bind(this);
  }

  render() {
    return (
      <div>
        <Navbar 
          account={ this.state.account }
        />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              videos={ this.state.videos }
              captureFile={ this.captureFile }
              uploadVideo={ this.uploadVideo }
              currentHash={ this.state.currentHash }
              currentTitle={ this.state.currentTitle }
              changeVideo={ this.changeVideo }
            />
        }
      </div>
    );
  }
}

export default App;