import { contractAddresses, abi } from "../constants"
// dont export from moralis when using react
import { useMoralis, useWeb3Contract } from "react-moralis"
import { useEffect, useState } from "react"
import { useNotification } from "web3uikit"
import { ethers } from "ethers"

export default function LotteryEntrance() {
    const { Moralis, isWeb3Enabled, chainId: chainIdHex } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const [entranceFee, setEntranceFee] = useState("0")
    const [entranceFeeWei, setEntranceFeeWei] = useState("0")
    const [numPlayers, setNumPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")
    const dispatch = useNotification()
    
    const { runContractFunction: getEntranceFee } = useWeb3Contract({ abi: abi, contractAddress: raffleAddress,  functionName: "getEntranceFee", params: {}})
    const { runContractFunction: enterRaffle, data: enterTxResponse, isLoading, isFetching, } = useWeb3Contract({ abi: abi, contractAddress: raffleAddress, functionName: "enterRaffle",msgValue: entranceFeeWei,params: {},})
    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({ abi: abi, contractAddress: raffleAddress,  functionName: "getNumberOfPlayers", params: {}})
    const { runContractFunction: getRecentWinner } = useWeb3Contract({ abi: abi, contractAddress: raffleAddress,  functionName: "getRecentWinner", params: {}})


    useEffect(() => {
        if (isWeb3Enabled) {
            
            updateUI();
        }
    }, [isWeb3Enabled])
    
    async function updateUI(){
        const entFeeWei=(await getEntranceFee()).toString();
        const numPlayersFromCall=(await getNumberOfPlayers()).toString();
        const recentWinnerFromCall=(await getRecentWinner()).toString();
        if(entranceFeeWei){
            setEntranceFeeWei(entFeeWei);
            setEntranceFee(ethers.utils.formatUnits(entFeeWei,"ether"));
        }// else show message: no entrance fee for this network. 
        setNumPlayers(numPlayersFromCall);
        setRecentWinner(recentWinnerFromCall);
    }

    const handleSuccess = async (tx) => {
        try {
            await tx.wait(1)
            handleNewNotification(tx)
            updateUI();
        } catch (error) {
            console.log(error)
        }
    }

    const handleNewNotification = () => {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Transaction Notification",
            position: "topR",
            icon: "bell",
        })
    }

    return (
        <div className="p-5">
            <h1 className="py-4 px-4 font-bold text-3xl">Lottery</h1>
            {raffleAddress 
                ? (<>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={async () =>
                            await enterRaffle({
                                // onComplete:
                                // onError:
                                onSuccess: handleSuccess,
                                onError: (error) => console.log(error),
                            })
                        }
                        disabled={isLoading || isFetching}>
                        {isLoading || isFetching 
                            ? 
                                (<div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>) 
                            :
                                 ("Enter Raffle")}
                    </button>
                    <div>Entrance Fee: {entranceFee} ETH</div>
                    <div>Players: {numPlayers}</div>
                    <div>lastWinner: {recentWinner}</div>
                   </>) 
                : (<div>
                    Please connect to a supported chain </div>
                  )}
        </div>
    )
}
