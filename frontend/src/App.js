import react, {useState, useEffect} from 'react';
import './App.css';
import detectEthereumProvider from '@metamask/detect-provider';
import Calendar from './Calendar';

function App() {

    const [account, setAccount] = useState(false);

    useEffect(() => {
        isConnected();
    }, []);

    const isConnected = async () => {
        console.log('isConnected');
        const provider = await detectEthereumProvider();
        const accounts = await provider.request({ method: "eth_accounts" });

        if (accounts.length > 0) {
            setAccount(accounts[0]); // the currently selected address is the first in the array returned.
        } else {
            console.log("No authorized account found")
        }
    }

    const disconnect = async () => {
        console.log("Disconnecting...");
        const provider = await detectEthereumProvider();
        await provider.request({
            method: "eth_requestAccounts",
            params: [{eth_accounts: {}}]
        })
        setAccount(false);
    }

    const connect = async () => {
        try {
            const provider = await detectEthereumProvider();

            // returns an array of accounts
            const accounts = await provider.request({ method: "eth_requestAccounts" });

            // check if array at least one element
            if (accounts.length > 0) {
                console.log(`Accounts found: ${accounts}`);
                setAccount(accounts[0]);
            } else {
                setAccount('No accounts found');
            }
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>calend3</h1>
                <p id="slogan">web3 appointment scheduler</p>
            </header>
            {!account ? <button onClick={connect}>connect to wallet</button>: <button onClick={disconnect}>disconnect from wallet</button>}
            {account && <div><Calendar></Calendar></div>}
            {account}
        </div>
    );
}

export default App;
