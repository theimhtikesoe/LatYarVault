"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"

// Contract ABIs and addresses
import dETHAbi from "@/lib/abis/dETH.json"
import sETHAbi from "@/lib/abis/sETH.json"
import governanceAbi from "@/lib/abis/governance.json"
import stakingDashboardAbi from "@/lib/abis/stakingDashboard.json"

type WalletProvider = ethers.Eip1193Provider & {
  on: (event: "accountsChanged" | "chainChanged", handler: (...args: any[]) => void) => void
  removeAllListeners: () => void
}

declare global {
  interface Window {
    ethereum?: WalletProvider
  }
}

// Contract addresses
// Contract addresses (can be provided via env for different deployments)
const DETH_ADDRESS = process.env.NEXT_PUBLIC_DETH_ADDRESS || "0x520d7dAB4A5bCE6ceA323470dbffCea14b78253a"
const SETH_ADDRESS = process.env.NEXT_PUBLIC_SETH_ADDRESS || "0x16b0cD88e546a90DbE380A63EbfcB487A9A05D8e"
const GOVERNANCE_ADDRESS = process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || "0xD396FE92075716598FAC875D12E708622339FA3e"
const STAKING_DASHBOARD_ADDRESS = process.env.NEXT_PUBLIC_STAKING_DASHBOARD_ADDRESS || "0xd33e9676463597AfFF5bB829796836631F4e2f1f"

// Holesky testnet configuration (use NEXT_PUBLIC_ env vars on the client)
const HOLESKY_CHAIN_ID = Number(process.env.NEXT_PUBLIC_HOLESKY_CHAIN_ID) || 17000
const HOLESKY_RPC_URL = process.env.NEXT_PUBLIC_HOLESKY_RPC_URL || "https://holesky.drpc.org"

// Warn when fallback values are used (helps developers notice missing env)
if (typeof window !== "undefined") {
  if (!process.env.NEXT_PUBLIC_HOLESKY_RPC_URL) console.warn("Using fallback HOLESKY_RPC_URL; set NEXT_PUBLIC_HOLESKY_RPC_URL in .env.local for stability.")
  if (!process.env.NEXT_PUBLIC_STAKING_DASHBOARD_ADDRESS) console.warn("Using fallback STAKING_DASHBOARD_ADDRESS; set NEXT_PUBLIC_STAKING_DASHBOARD_ADDRESS in .env.local if different.")
}

type Web3ContextType = {
  account: string | null
  provider: ethers.JsonRpcProvider | null
  signer: ethers.JsonRpcSigner | null
  dETHContract: ethers.Contract | null
  sETHContract: ethers.Contract | null
  governanceContract: ethers.Contract | null
  stakingDashboardContract: ethers.Contract | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  isConnected: boolean
  chainId: number | null
  refreshBalances: () => Promise<void>
  networkName: string
  ethBalance: string
  dETHBalance: string
  sETHBalance: string
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  provider: null,
  signer: null,
  dETHContract: null,
  sETHContract: null,
  governanceContract: null,
  stakingDashboardContract: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isConnected: false,
  chainId: null,
  refreshBalances: async () => {},
  networkName: "",
  ethBalance: "0",
  dETHBalance: "0",
  sETHBalance: "0",
})

export const useWeb3 = () => useContext(Web3Context)

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [dETHContract, setDETHContract] = useState<ethers.Contract | null>(null)
  const [sETHContract, setSETHContract] = useState<ethers.Contract | null>(null)
  const [governanceContract, setGovernanceContract] = useState<ethers.Contract | null>(null)
  const [stakingDashboardContract, setStakingDashboardContract] = useState<ethers.Contract | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)
  const [networkName, setNetworkName] = useState("")
  const [hasShownConnectToast, setHasShownConnectToast] = useState(false)
  const [ethBalance, setEthBalance] = useState("0")
  const [dETHBalance, setDETHBalance] = useState("0")
  const [sETHBalance, setSETHBalance] = useState("0")

  const { toast } = useToast()

  const loadBalances = async (address: string, rpcProvider = provider ?? new ethers.JsonRpcProvider(HOLESKY_RPC_URL)) => {
    const [ethResult, dETHResult, sETHResult] = await Promise.allSettled([
      rpcProvider.getBalance(address),
      new ethers.Contract(DETH_ADDRESS, dETHAbi, rpcProvider).balanceOf(address),
      new ethers.Contract(SETH_ADDRESS, sETHAbi, rpcProvider).balanceOf(address),
    ])

    if (ethResult.status === "fulfilled") {
      const formatted = ethers.formatEther(ethResult.value)
      console.log("Updated ETH balance:", formatted)
      setEthBalance(formatted)
    } else {
      console.error("Error refreshing ETH balance:", ethResult.reason)
      setEthBalance("0")
    }

    if (dETHResult.status === "fulfilled") {
      const formatted = ethers.formatEther(dETHResult.value)
      console.log("Updated dETH balance:", formatted)
      setDETHBalance(formatted)
    } else {
      console.error("Error refreshing dETH balance:", dETHResult.reason)
      setDETHBalance("0")
    }

    if (sETHResult.status === "fulfilled") {
      const formatted = ethers.formatEther(sETHResult.value)
      console.log("Updated sETH balance:", formatted)
      setSETHBalance(formatted)
    } else {
      console.error("Error refreshing sETH balance:", sETHResult.reason)
      setSETHBalance("0")
    }
  }

  // Ensure contracts are connected with the correct signer
  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        console.log("Connecting wallet...")

        // Request account access
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })

        const userAddress = accounts[0]
        console.log("Connected account:", userAddress)

        // Check current chain ID
        const chainIdHex = await window.ethereum.request({
          method: "eth_chainId",
        })
        const currentChainId = Number.parseInt(chainIdHex, 16)
        console.log("Current chain ID:", currentChainId)

        // If not on the correct network, ask user to switch
        if (currentChainId !== HOLESKY_CHAIN_ID) {
          console.log("Not on the correct network, attempting to switch...")
          try {
            // Try to switch to the correct network
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${HOLESKY_CHAIN_ID.toString(16)}` }],
            })
            console.log("Successfully switched network")
          } catch (switchError: any) {
            // If network hasn't been added, add it to wallet
            if (switchError.code === 4902) {
              console.log("Network not found, adding network...")
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: `0x${HOLESKY_CHAIN_ID.toString(16)}`,
                    chainName: "Ethereum Testnet",
                    nativeCurrency: {
                      name: "ETH",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: [HOLESKY_RPC_URL],
                    blockExplorerUrls: ["https://holesky.etherscan.io"],
                  },
                ],
              })
              console.log("Network added")
            } else {
              throw switchError
            }
          }
        }

        // Create direct provider to RPC for reliable connection
        const directProvider = new ethers.JsonRpcProvider(HOLESKY_RPC_URL)
        console.log("Created direct provider to RPC")

        // Create browser provider for wallet interaction
        const browserProvider = new ethers.BrowserProvider(window.ethereum)
        console.log("Created browser provider")

        // Get signer from browser provider
        const web3Signer = await browserProvider.getSigner()
        console.log("Got signer:", await web3Signer.getAddress())

        setNetworkName("Connected")
        setAccount(userAddress)
        setProvider(directProvider)
        setSigner(web3Signer)
        setIsConnected(true)
        setChainId(HOLESKY_CHAIN_ID)

        // Verify contract bytecode exists at expected addresses without blocking wallet connection.
        try {
          const stakingCode = await directProvider.getCode(STAKING_DASHBOARD_ADDRESS)
          console.log("StakingDashboard contract code:", stakingCode)
          if (!stakingCode || stakingCode === "0x") {
            toast({
              title: "Contract Not Found",
              description: "Wallet connected, but the staking contract was not found on the configured network.",
              variant: "destructive",
            })
          }
        } catch (codeErr) {
          console.warn("Failed to fetch contract code:", codeErr)
        }

        // Print contract addresses for debugging
        console.log("Contract addresses:", {
          dETH: DETH_ADDRESS,
          sETH: SETH_ADDRESS,
          governance: GOVERNANCE_ADDRESS,
          stakingDashboard: STAKING_DASHBOARD_ADDRESS,
        })

        try {
          // Initialize contracts with correct signer
          const dETH = new ethers.Contract(DETH_ADDRESS, dETHAbi, web3Signer)
          console.log("dETH contract initialized:", dETH.target)

          const sETH = new ethers.Contract(SETH_ADDRESS, sETHAbi, web3Signer)
          console.log("sETH contract initialized:", sETH.target)

          const governance = new ethers.Contract(GOVERNANCE_ADDRESS, governanceAbi, web3Signer)
          console.log("Governance contract initialized:", governance.target)

          const stakingDashboard = new ethers.Contract(STAKING_DASHBOARD_ADDRESS, stakingDashboardAbi, web3Signer)
          console.log("StakingDashboard contract initialized:", stakingDashboard.target)

          setDETHContract(dETH)
          setSETHContract(sETH)
          setGovernanceContract(governance)
          setStakingDashboardContract(stakingDashboard)
        } catch (contractError) {
          console.error("Error initializing contracts:", contractError)
          toast({
            title: "Contract Initialization Error",
            description: "There was an error initializing the smart contracts.",
            variant: "destructive",
          })
        }

        await loadBalances(userAddress, directProvider)

        // Only show toast when first connected
        if (!hasShownConnectToast) {
          toast({
            title: "Wallet Connected",
            description: `Connected to ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`,
          })
          setHasShownConnectToast(true)
        }
      } catch (error) {
        console.error("Error connecting wallet:", error)
        toast({
          title: "Connection Failed",
          description: "Failed to connect wallet. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Metamask Not Found",
        description: "Please install Metamask to use this application",
        variant: "destructive",
      })
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setSigner(null)
    setIsConnected(false)
    setHasShownConnectToast(false)
    setEthBalance("0")
    setDETHBalance("0")
    setSETHBalance("0")

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    })
  }

  const refreshBalances = async () => {
    if (account) {
      try {
        console.log("Refreshing balances for account:", account)
        await loadBalances(account)
      } catch (error) {
        console.error("Error refreshing balances:", error)
      }
    }
  }

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts: string[]) => {
        console.log("Account changed:", accounts)
        if (accounts.length > 0) {
          setAccount(accounts[0])

          await loadBalances(accounts[0])
        } else {
          setAccount(null)
          setIsConnected(false)
          setHasShownConnectToast(false)
          setEthBalance("0")
          setDETHBalance("0")
          setSETHBalance("0")
        }
      })

      // Add listener for chain changes
      window.ethereum.on("chainChanged", async (chainId: string) => {
        const newChainId = Number.parseInt(chainId, 16)
        console.log("Chain changed to:", newChainId)
        setChainId(newChainId)

        if (newChainId !== HOLESKY_CHAIN_ID) {
          toast({
            title: "Wrong Network",
            description: "Please switch to the correct network",
            variant: "destructive",
          })
          setIsConnected(false)
          setNetworkName("")
          setHasShownConnectToast(false)
        } else {
          setNetworkName("Connected")
          if (account) {
            await loadBalances(account)
          }
        }
      })
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeAllListeners()
      }
    }
  }, [account])

  // Auto connect if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          })
          if (accounts.length > 0) {
            console.log("Auto-connecting previously connected account")
            connectWallet()
          }
        } catch (error) {
          console.error("Error checking connection:", error)
        }
      }
    }

    checkConnection()
  }, [])

  // Refresh balances when new blocks arrive, with polling as a fallback.
  useEffect(() => {
    let intervalId: NodeJS.Timeout
    const handleBlock = () => {
      console.log("New block detected, refreshing balances")
      refreshBalances()
    }

    if (isConnected && account && provider) {
      provider.on("block", handleBlock)
      intervalId = setInterval(() => {
        console.log("Periodic balance refresh")
        refreshBalances()
      }, 15000)
    }

    return () => {
      if (provider) {
        provider.off("block", handleBlock)
      }
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isConnected, account, provider])

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        dETHContract,
        sETHContract,
        governanceContract,
        stakingDashboardContract,
        connectWallet,
        disconnectWallet,
        isConnected,
        chainId,
        refreshBalances,
        networkName,
        ethBalance,
        dETHBalance,
        sETHBalance,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}
