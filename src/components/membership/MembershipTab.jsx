import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { loyaltyAPI, usersAPI } from '../../services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../common/LoadingSpinner'
import './MembershipTab.css'

const MembershipTab = ({ user }) => {
  const queryClient = useQueryClient()
  const [redeemAmount, setRedeemAmount] = useState('')
  const [referralData, setReferralData] = useState({
    friendPhoneNumber: '',
    friendName: ''
  })

  // Fetch loyalty data
  const { data: loyaltyData, isLoading: loyaltyLoading } = useQuery(
    'loyaltyData',
    loyaltyAPI.getMyCoins,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      onError: (error) => {
        console.error('Failed to fetch loyalty data:', error)
      }
    }
  )

  // Fetch user analytics for progress calculation
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery(
    'userAnalytics',
    () => usersAPI.getAnalytics(),
    {
      onError: (error) => {
        console.error('Failed to fetch analytics data:', error)
      }
    }
  )

  // Fetch membership details
  const { data: membershipData, isLoading: membershipLoading } = useQuery(
    'membershipDetails',
    usersAPI.getMembershipDetails,
    {
      onError: (error) => {
        console.error('Failed to fetch membership data:', error)
      }
    }
  )

  // Fetch referrals
  const { data: referralsData, isLoading: referralsLoading } = useQuery(
    'referrals',
    loyaltyAPI.getReferrals,
    {
      onError: (error) => {
        console.error('Failed to fetch referrals:', error)
      }
    }
  )

  // Redeem coins mutation
  const redeemMutation = useMutation(
    (amount) => loyaltyAPI.redeemCoins({ amount: parseInt(amount) }),
    {
      onSuccess: (response) => {
        toast.success(`Successfully redeemed ${redeemAmount} AggreCoins! Cash value: ₹${response.data?.data?.cashValue || (redeemAmount * 0.1)}`)
        setRedeemAmount('')
        queryClient.invalidateQueries('loyaltyData')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to redeem coins')
      }
    }
  )

  // Refer friend mutation
  const referMutation = useMutation(
    (data) => loyaltyAPI.referFriend(data),
    {
      onSuccess: () => {
        toast.success('Referral sent successfully! Your friend will receive an SMS invitation.')
        setReferralData({ friendPhoneNumber: '', friendName: '' })
        queryClient.invalidateQueries('referrals')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to send referral')
      }
    }
  )

  const handleRedeem = (e) => {
    e.preventDefault()
    const amount = parseInt(redeemAmount)
    
    if (!redeemAmount || amount < 100) {
      toast.error('Minimum redemption amount is 100 coins')
      return
    }
    
    if (amount > (loyaltyData?.data?.balance || 0)) {
      toast.error('Insufficient coin balance')
      return
    }
    
    redeemMutation.mutate(amount)
  }

  const handleRefer = (e) => {
    e.preventDefault()
    
    if (!referralData.friendPhoneNumber) {
      toast.error('Please enter your friend\'s phone number')
      return
    }
    
    // Validate Indian phone number
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(referralData.friendPhoneNumber)) {
      toast.error('Please enter a valid Indian phone number (10 digits, starting with 6-9)')
      return
    }
    
    referMutation.mutate(referralData)
  }

  const handleReferralInputChange = (e) => {
    const { name, value } = e.target
    setReferralData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const getTierInfo = (tier) => {
    const tiers = {
      platinum: {
        name: 'Platinum',
        icon: '💎',
        color: '#E5E4E2',
        benefits: ['15% discount on all orders', 'Priority delivery', 'Dedicated account manager', 'Free site visits'],
        requirements: { orders: 25, value: 1000000 } // ₹10L
      },
      gold: {
        name: 'Gold',
        icon: '🥇',
        color: '#FFD700',
        benefits: ['10% discount on all orders', 'Fast delivery', 'Premium support', 'Extended warranty'],
        requirements: { orders: 10, value: 200000 } // ₹2L
      },
      silver: {
        name: 'Silver',
        icon: '🥈',
        color: '#C0C0C0',
        benefits: ['5% discount on all orders', 'Standard delivery', 'Basic support', 'AggreCoin rewards'],
        requirements: { orders: 3, value: 50000 } // ₹50K
      }
    }

    return tiers[tier] || tiers.silver
  }

  const getNextTierInfo = (currentTier) => {
    const tierOrder = ['silver', 'gold', 'platinum']
    const currentIndex = tierOrder.indexOf(currentTier)
    
    if (currentIndex < tierOrder.length - 1) {
      return getTierInfo(tierOrder[currentIndex + 1])
    }
    
    return null // Already at highest tier
  }

  const calculateProgress = (currentTier, userStats) => {
    const nextTier = getNextTierInfo(currentTier)
    
    if (!nextTier || !userStats) {
      return { percentage: 100, ordersProgress: 100, valueProgress: 100, isMaxTier: !nextTier }
    }

    const { totalOrders = 0, totalSpent = 0 } = userStats
    const { orders: requiredOrders, value: requiredValue } = nextTier.requirements

    // Calculate progress for both requirements
    const ordersProgress = Math.min((totalOrders / requiredOrders) * 100, 100)
    const valueProgress = Math.min((totalSpent / requiredValue) * 100, 100)
    
    // Overall progress is the minimum of both requirements (both must be met)
    const overallProgress = Math.min(ordersProgress, valueProgress)

    return {
      percentage: Math.round(overallProgress),
      ordersProgress: Math.round(ordersProgress),
      valueProgress: Math.round(valueProgress),
      isMaxTier: false,
      nextTier,
      current: { orders: totalOrders, value: totalSpent },
      required: { orders: requiredOrders, value: requiredValue },
      remaining: {
        orders: Math.max(0, requiredOrders - totalOrders),
        value: Math.max(0, requiredValue - totalSpent)
      }
    }
  }

  if (loyaltyLoading || analyticsLoading || membershipLoading) {
    return (
      <div className="membership-loading">
        <LoadingSpinner />
        <p>Loading membership data...</p>
      </div>
    )
  }

  const loyalty = loyaltyData?.data || {}
  const referrals = referralsData?.data || {}
  const analytics = analyticsData?.data || {}
  const membership = membershipData?.data || {}
  
  const currentTier = user?.membershipTier || membership?.tier || 'silver'
  const tierInfo = getTierInfo(currentTier)
  
  // Calculate dynamic progress
  const userStats = {
    totalOrders: analytics.totalOrders || membership?.totalOrders || 0,
    totalSpent: analytics.totalSpent || membership?.totalSpent || 0
  }
  
  const progressInfo = calculateProgress(currentTier, userStats)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="membership-tab">
      {/* Membership Tier Card */}
      <div className="tier-card">
        <div className="tier-header">
          <div className="tier-badge" style={{ background: tierInfo.color }}>
            <span className="tier-icon">{tierInfo.icon}</span>
            <span className="tier-name">{tierInfo.name}</span>
          </div>
          <div className="tier-progress">
            <div className="progress-info">
              <span>
                {progressInfo.isMaxTier 
                  ? 'Highest tier achieved!' 
                  : `Progress to ${progressInfo.nextTier?.name}`
                }
              </span>
              <span>{progressInfo.percentage}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressInfo.percentage}%` }}
              ></div>
            </div>
            {!progressInfo.isMaxTier && (
              <div className="progress-details">
                <small>
                  Orders: {userStats.totalOrders}/{progressInfo.required.orders} 
                  {progressInfo.remaining.orders > 0 && ` (${progressInfo.remaining.orders} more needed)`}
                </small>
                <small>
                  Spent: {formatCurrency(userStats.totalSpent)}/{formatCurrency(progressInfo.required.value)}
                  {progressInfo.remaining.value > 0 && ` (${formatCurrency(progressInfo.remaining.value)} more needed)`}
                </small>
              </div>
            )}
          </div>
        </div>

        {/* AggreCoins Balance */}
        <div className="coins-balance">
          <div className="coins-header">
            <div className="coins-icon">🪙</div>
            <div className="coins-info">
              <h3>{loyalty.balance?.toLocaleString() || 0} AggreCoins</h3>
              <p>Available Balance</p>
            </div>
          </div>
          <div className="coins-stats">
            <div className="coins-stat">
              <span>Earned: {loyalty.totalEarned?.toLocaleString() || 0}</span>
            </div>
            <div className="coins-stat">
              <span>Redeemed: {loyalty.totalRedeemed?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Benefits */}
      <div className="tier-benefits">
        <h3>Your {tierInfo.name} Benefits</h3>
        <div className="benefits-grid">
          {tierInfo.benefits.map((benefit, index) => (
            <div key={index} className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span className="benefit-text">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Breakdown - NEW */}
      {!progressInfo.isMaxTier && (
        <div className="progress-breakdown">
          <h3>Next Tier Requirements</h3>
          <div className="requirements-grid">
            <div className="requirement-item">
              <div className="requirement-header">
                <span>Orders Completed</span>
                <span>{progressInfo.ordersProgress}%</span>
              </div>
              <div className="requirement-bar">
                <div 
                  className="requirement-fill" 
                  style={{ width: `${progressInfo.ordersProgress}%` }}
                ></div>
              </div>
              <small>{userStats.totalOrders} of {progressInfo.required.orders} orders</small>
            </div>
            <div className="requirement-item">
              <div className="requirement-header">
                <span>Total Spending</span>
                <span>{progressInfo.valueProgress}%</span>
              </div>
              <div className="requirement-bar">
                <div 
                  className="requirement-fill" 
                  style={{ width: `${progressInfo.valueProgress}%` }}
                ></div>
              </div>
              <small>{formatCurrency(userStats.totalSpent)} of {formatCurrency(progressInfo.required.value)}</small>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        {/* Redeem Coins */}
        <div className="action-card">
          <h4>Redeem AggreCoins</h4>
          <p>Redeem your coins for cash value (1 AggreCoin = ₹0.10)</p>
          <form onSubmit={handleRedeem} className="redeem-form">
            <div className="input-group">
              <input
                type="number"
                placeholder="Enter amount (min 100)"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                min="100"
                max={loyalty.balance || 0}
                step="10"
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={redeemMutation.isLoading || !redeemAmount || parseInt(redeemAmount) < 100}
              >
                {redeemMutation.isLoading ? 'Redeeming...' : 'Redeem'}
              </button>
            </div>
            <small>Available: {loyalty.balance || 0} coins | Cash value: ₹{((redeemAmount || 0) * 0.1).toFixed(2)}</small>
          </form>
        </div>

        {/* Refer Friends */}
        <div className="action-card">
          <h4>Refer & Earn</h4>
          <p>Refer friends and earn 500 AggreCoins for each successful referral</p>
          <form onSubmit={handleRefer} className="refer-form">
            <div className="input-group">
              <input
                type="tel"
                name="friendPhoneNumber"
                placeholder="Friend's phone number (10 digits)"
                value={referralData.friendPhoneNumber}
                onChange={handleReferralInputChange}
                maxLength="10"
                pattern="[6-9][0-9]{9}"
              />
              <input
                type="text"
                name="friendName"
                placeholder="Friend's name (optional)"
                value={referralData.friendName}
                onChange={handleReferralInputChange}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={referMutation.isLoading || !referralData.friendPhoneNumber}
              >
                {referMutation.isLoading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
            <small>Your referral code: {loyalty.referralCode || 'Loading...'}</small>
          </form>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="referral-stats">
        <h3>Referral Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{referrals.totalReferrals || 0}</span>
            <span className="stat-label">Total Referrals</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{referrals.completedReferrals || 0}</span>
            <span className="stat-label">Successful</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">₹{referrals.totalEarnings || 0}</span>
            <span className="stat-label">Total Earnings</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {loyalty.recentTransactions && loyalty.recentTransactions.length > 0 && (
        <div className="recent-transactions">
          <h3>Recent Transactions</h3>
          <div className="transactions-list">
            {loyalty.recentTransactions.slice(0, 5).map((transaction, index) => (
              <div key={index} className="transaction-item">
                <div className="transaction-info">
                  <span className="transaction-type">{transaction.description}</span>
                  <span className="transaction-date">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`transaction-amount ${transaction.type === 'earned' ? 'positive' : 'negative'}`}>
                  {transaction.type === 'earned' ? '+' : '-'}{transaction.amount} coins
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MembershipTab