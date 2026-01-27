"use client"

import { useEffect, useState } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { ethers } from "ethers"
import { Wallet, Layers, Users, BarChart3, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function StakingDashboard() {
  const { stakingDashboardContract, isConnected, account, refreshBalances, ethBalance, dETHBalance, sETHBalance } =
    useWeb3()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [overview, setOverview] = useState({
    totalETHDeposited: "0",
    totalETHStaked: "0",
    totalStakers: "0",
    averageStakeAmount: "0",
  })
  const [userStats, setUserStats] = useState({
    stakedAmount: "0",
    stakingTimestamp: "0",
    rank: "0",
    percentageOfTotal: "0",
  })

  const fetchData = async () => {
    if (stakingDashboardContract) {
      try {
        setLoading(true)

        // Get staking overview
        let overviewData
        try {
          overviewData = await stakingDashboardContract.getStakingOverview()
        } catch (overviewErr) {
          console.error("getStakingOverview reverted:", overviewErr)
          try {
            // Attempt to get low-level call result / revert data for diagnostics
            const data = stakingDashboardContract.interface.encodeFunctionData("getStakingOverview", [])
            const providerInstance = stakingDashboardContract.provider ?? stakingDashboardContract.signer?.provider
            if (providerInstance && typeof providerInstance.call === "function") {
              const callRes = await providerInstance.call({ to: (stakingDashboardContract as any).target ?? (stakingDashboardContract as any).address, data })
              console.log("provider.call result (raw):", callRes)
            } else {
              console.warn("No provider available on contract for diagnostic provider.call. Skipping provider.call.")
            }
          } catch (callErr) {
            console.error("provider.call diagnostic failed:", callErr)
          }
          throw overviewErr
        }
        setOverview({
          totalETHDeposited: ethers.formatEther(overviewData.totalETHDeposited),
          totalETHStaked: ethers.formatEther(overviewData.totalETHStaked),
          totalStakers: overviewData.totalStakers.toString(),
          averageStakeAmount: ethers.formatEther(overviewData.averageStakeAmount),
        })

        // Get user stats if connected
        if (account) {
          const userStatsData = await stakingDashboardContract.getStakerDetails(account)
          setUserStats({
            stakedAmount: ethers.formatEther(userStatsData.stakedAmount),
            stakingTimestamp: new Date(Number(userStatsData.stakingTimestamp) * 1000).toLocaleDateString(),
            rank: userStatsData.rank.toString(),
            percentageOfTotal: (Number(userStatsData.percentageOfTotal) / 100).toFixed(2),
          })
        }
      } catch (error) {
        console.error("Error fetching staking data:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchData()
    }
  }, [stakingDashboardContract, account, isConnected, mounted])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalances()
    await fetchData()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  if (!mounted) {
    return null
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-white text-lightblue-600 border-lightblue-200 hover:bg-lightblue-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-lightblue-700">Available Balance</h3>
            <Wallet className="h-5 w-5 text-lightblue-500" />
          </div>
          <div className="text-2xl font-bold text-lightblue-950">{Number.parseFloat(dETHBalance).toFixed(4)}</div>
          <div className="text-sm font-medium text-lightblue-600">dETH</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-lightblue-700">Staked Balance</h3>
            <Layers className="h-5 w-5 text-lightblue-500" />
          </div>
          <div className="text-2xl font-bold text-lightblue-950">{Number.parseFloat(sETHBalance).toFixed(4)}</div>
          <div className="text-sm font-medium text-lightblue-600">sETH</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-lightblue-700">Total Protocol Staked</h3>
            <BarChart3 className="h-5 w-5 text-lightblue-500" />
          </div>
          <div className="text-2xl font-bold text-lightblue-950">
            {Number.parseFloat(overview.totalETHStaked).toFixed(2)}
          </div>
          <div className="text-sm font-medium text-lightblue-600">ETH</div>
        </div>
      </div>

      {/* Actions */}
      <h2 className="section-title">Actions</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/deposit" className="action-button">
          <ArrowDownToLine className="h-5 w-5" />
          Deposit
        </Link>
        <Link href="/deposit?tab=withdraw" className="action-button">
          <ArrowUpFromLine className="h-5 w-5" />
          Withdraw
        </Link>
        <Link href="/stake" className="action-button">
          <Layers className="h-5 w-5" />
          Stake
        </Link>
        <Link href="/stake?tab=unstake" className="action-button">
          <ArrowUpFromLine className="h-5 w-5" />
          Unstake
        </Link>
      </div>

      {/* Total Stakers */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-lightblue-700">Total Stakers</h3>
          <Users className="h-5 w-5 text-lightblue-500" />
        </div>
        <div className="text-2xl font-bold text-lightblue-950">{overview.totalStakers}</div>
        <div className="text-sm text-lightblue-700 mt-2">
          Average stake: {Number.parseFloat(overview.averageStakeAmount).toFixed(4)} ETH
        </div>
      </div>
    </div>
  )
}
