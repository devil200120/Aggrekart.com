import React from 'react'
import { Link } from 'react-router-dom'
import './MembershipCard.css'

const MembershipCard = ({ user }) => {
  const getTierInfo = (tier) => {
    switch (tier) {
      case 'platinum':
        return {
          name: 'Platinum',
          icon: '💎',
          color: '#E5E4E2',
          benefits: ['15% discount', 'Priority delivery', 'Dedicated support'],
          nextTier: null
        }
      case 'gold':
        return {
          name: 'Gold',
          icon: '🥇',
          color: '#FFD700',
          benefits: ['10% discount', 'Fast delivery', 'Premium support'],
          nextTier: 'Platinum'
        }
      case 'silver':
      default:
        return {
          name: 'Silver',
          icon: '🥈',
          color: '#C0C0C0',
          benefits: ['5% discount', 'Standard delivery', 'Basic support'],
          nextTier: 'Gold'
        }
    }
  }

  const tierInfo = getTierInfo(user?.membershipTier)
  const aggreCoins = user?.aggreCoins || 0
  const orderCount = user?.orderCount || 0

  // Calculate progress to next tier
  const getNextTierProgress = () => {
    if (tierInfo.nextTier === 'Gold') {
      return Math.min((orderCount / 10) * 100, 100) // 10 orders for Gold
    } else if (tierInfo.nextTier === 'Platinum') {
      return Math.min((orderCount / 25) * 100, 100) // 25 orders for Platinum
    }
    return 100 // Already at highest tier
  }

  if (!user) {
    return (
      <div className="membership-card guest">
        <div className="membership-header">
          <div className="membership-icon">👋</div>
          <div className="membership-info">
            <h3>Welcome to Aggrekart!</h3>
            <p>Join now to start earning AggreCoins and enjoy member benefits</p>
          </div>
        </div>
        <div className="membership-actions">
          <Link to="/auth/register" className="btn btn-primary">
            Join Now
          </Link>
          <Link to="/auth/login" className="btn btn-outline">
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`membership-card ${tierInfo.name.toLowerCase()}`}>
      <div className="membership-header">
        <div className="membership-tier">
          <div className="tier-icon">{tierInfo.icon}</div>
          <div className="tier-info">
            <h3>{tierInfo.name} Member</h3>
            <p>Hello, {user.name}!</p>
          </div>
        </div>
        <div className="aggre-coins">
          <div className="coins-icon">🪙</div>
          <div className="coins-info">
            <span className="coins-amount">{aggreCoins.toLocaleString()}</span>
            <span className="coins-label">AggreCoins</span>
          </div>
        </div>
      </div>

      <div className="membership-progress">
        {tierInfo.nextTier && (
          <>
            <div className="progress-info">
              <span>Progress to {tierInfo.nextTier}</span>
              <span>{orderCount} orders</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getNextTierProgress()}%` }}
              ></div>
            </div>
          </>
        )}
      </div>

      <div className="membership-benefits">
        <h4>Your Benefits:</h4>
        <ul>
          {tierInfo.benefits.map((benefit, index) => (
            <li key={index}>✓ {benefit}</li>
          ))}
        </ul>
      </div>

      <div className="membership-actions">
        <Link to="/profile?tab=membership" className="btn btn-outline">
          View Details
        </Link>
        <Link to="/products" className="btn btn-primary">
          Start Shopping
        </Link>
      </div>
    </div>
  )
}

export default MembershipCard