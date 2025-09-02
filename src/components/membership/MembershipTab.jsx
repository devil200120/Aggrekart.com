import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { loyaltyAPI, usersAPI } from "../../services/api";
import toast from "react-hot-toast";
import LoadingSpinner from "../common/LoadingSpinner";
import "./MembershipTab.css";

const MembershipTab = ({ user }) => {
  const queryClient = useQueryClient();
  const [redeemAmount, setRedeemAmount] = useState("");
  const [referralData, setReferralData] = useState({
    friendPhoneNumber: "",
    friendName: "",
  });
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Fetch loyalty data with proper error handling
  const {
    data: loyaltyData,
    isLoading: loyaltyLoading,
    error: loyaltyError,
  } = useQuery("loyaltyData", loyaltyAPI.getMyCoins, {
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error("Failed to fetch loyalty data:", error);
      if (error?.response?.status === 404 || error?.response?.status === 401) {
        console.warn("User may not have loyalty account yet");
      }
    },
  });

  // Fetch user dashboard data for membership info
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    "userDashboard",
    () => usersAPI.getDashboard(),
    {
      retry: 2,
      onError: (error) => {
        console.warn("Dashboard data not available:", error);
      },
    }
  );

  // Fetch referrals with error handling
  const {
    data: referralsData,
    isLoading: referralsLoading,
    error: referralsError,
  } = useQuery(
    "referrals",
    async () => {
      try {
        console.log("🔍 MembershipTab: Fetching referrals...");
        const response = await loyaltyAPI.getReferrals();
        console.log("✅ MembershipTab: Referrals response:", response);
        return response;
      } catch (error) {
        console.error("❌ MembershipTab: Referrals fetch error:", error);
        // Return empty data structure instead of throwing
        return {
          data: {
            totalReferrals: 0,
            completedReferrals: 0,
            pendingReferrals: 0,
            totalEarnings: 0,
            referralCode: `AGK${user?.customerId?.slice(-6)?.toUpperCase() || "USER01"}`,
            recentReferrals: [],
          },
        };
      }
    },
    {
      retry: 1, // Only retry once
      retryDelay: 2000,
      onError: (error) => {
        console.warn("Referrals data not available:", error);
      },
      // Enable the query but provide fallback data
      enabled: !!user,
    }
  );

  // Redeem coins mutation
  const redeemMutation = useMutation(
    (amount) => loyaltyAPI.redeemCoins({ amount: parseInt(amount) }),
    {
      onSuccess: (response) => {
        const cashValue = response.data?.data?.cashValue || redeemAmount * 0.1;
        toast.success(
          `Successfully redeemed ${redeemAmount} AggreCoins for ₹${cashValue}!`
        );
        setRedeemAmount("");
        setShowRedeemModal(false);
        queryClient.invalidateQueries("loyaltyData");
      },
      onError: (error) => {
        const message =
          error?.response?.data?.message || "Failed to redeem coins";
        toast.error(message);
      },
    }
  );

  // Refer friend mutation
  const referMutation = useMutation((data) => loyaltyAPI.referFriend(data), {
    onSuccess: () => {
      toast.success(
        "Referral sent successfully! Your friend will receive an SMS invitation."
      );
      setReferralData({ friendPhoneNumber: "", friendName: "" });
      queryClient.invalidateQueries("referrals");
      queryClient.invalidateQueries("loyaltyData");
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message || "Failed to send referral";
      toast.error(message);
    },
  });

  const handleRedeem = (e) => {
    e.preventDefault();
    const amount = parseInt(redeemAmount);

    if (!redeemAmount || amount < 100) {
      toast.error("Minimum redemption amount is 100 coins");
      return;
    }

    const availableBalance = loyaltyData?.data?.balance || 0;
    if (amount > availableBalance) {
      toast.error(
        `Insufficient AggreCoins balance. Available: ${availableBalance}`
      );
      return;
    }

    redeemMutation.mutate(amount);
  };

  const handleReferFriend = (e) => {
    e.preventDefault();

    if (!referralData.friendPhoneNumber || !referralData.friendName) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(referralData.friendPhoneNumber)) {
      toast.error("Please enter a valid Indian phone number");
      return;
    }

    referMutation.mutate(referralData);
  };

  const handleReferralChange = (e) => {
    const { name, value } = e.target;
    setReferralData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate membership progress from user data
  const getMembershipProgress = () => {
    const userTier = user?.membershipTier || "silver";
    const totalSpent =
      user?.totalOrderValue || dashboardData?.data?.stats?.totalSpent || 0;

    const tiers = {
      silver: { threshold: 0, nextThreshold: 50000, nextTier: "gold" },
      gold: { threshold: 50000, nextThreshold: 200000, nextTier: "platinum" },
      platinum: { threshold: 200000, nextThreshold: null, nextTier: null },
    };

    const currentTier = tiers[userTier];
    if (!currentTier.nextThreshold) {
      return { progress: 100, remaining: 0, nextTier: null };
    }

    const progress = Math.min(
      ((totalSpent - currentTier.threshold) /
        (currentTier.nextThreshold - currentTier.threshold)) *
        100,
      100
    );
    const remaining = Math.max(currentTier.nextThreshold - totalSpent, 0);

    return { progress, remaining, nextTier: currentTier.nextTier };
  };

  const membershipProgress = getMembershipProgress();

  // Show loading state
  if (loyaltyLoading || dashboardLoading) {
    return (
      <div className="membership-tab">
        <LoadingSpinner />
      </div>
    );
  }

  // Get data with fallbacks
  const loyaltyBalance = loyaltyData?.data?.balance || 0;
  const totalEarned = loyaltyData?.data?.totalEarned || 0;
  const totalRedeemed = loyaltyData?.data?.totalRedeemed || 0;
  const referralCode =
    loyaltyData?.data?.referralCode ||
    `AGGRE${user?.name?.slice(0, 3).toUpperCase() || "USR"}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

  return (
    <div className="membership-tab">
      {/* Membership Status */}
      <div className="membership-status">
        <div className="membership-tier">
          <div className="tier-badge">
            <span className="tier-icon">
              {user?.membershipTier === "platinum"
                ? "💎"
                : user?.membershipTier === "gold"
                  ? "🥇"
                  : "🥈"}
            </span>
            <div className="tier-info">
              <h3>
                {(user?.membershipTier || "silver").charAt(0).toUpperCase() +
                  (user?.membershipTier || "silver").slice(1)}{" "}
                Member
              </h3>
              <p>
                {membershipProgress.nextTier
                  ? `Progress to ${membershipProgress.nextTier}`
                  : "Highest Tier Achieved"}
              </p>
            </div>
          </div>

          {membershipProgress.nextTier && (
            <div className="progress-section">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.max(membershipProgress.progress, 5)}%`,
                  }}
                ></div>
              </div>
              <div className="progress-text">
                <span>{membershipProgress.progress.toFixed(1)}% Complete</span>
                <span>
                  ₹{membershipProgress.remaining.toLocaleString()} more needed
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="membership-benefits">
          <h4>Your Benefits</h4>
          <div className="benefits-list">
            <div className="benefit-item">
              <span className="benefit-icon">🚚</span>
              <span>
                Free delivery on orders above ₹
                {user?.membershipTier === "platinum"
                  ? "1000"
                  : user?.membershipTier === "gold"
                    ? "1500"
                    : "2000"}
              </span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">💰</span>
              <span>
                {user?.membershipTier === "platinum"
                  ? "10%"
                  : user?.membershipTier === "gold"
                    ? "5%"
                    : "2%"}{" "}
                discount on all orders
              </span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🪙</span>
              <span>
                {user?.membershipTier === "platinum"
                  ? "2x"
                  : user?.membershipTier === "gold"
                    ? "1.5x"
                    : "1x"}{" "}
                AggreCoins multiplier
              </span>
            </div>
            {(user?.membershipTier === "gold" ||
              user?.membershipTier === "platinum") && (
              <div className="benefit-item">
                <span className="benefit-icon">⭐</span>
                <span>Priority customer support</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AggreCoins Overview */}
      <div className="aggrecoins-overview">
        <div className="coins-header">
          <div className="coins-info">
            <h3>🪙 AggreCoins Wallet</h3>
            <div className="coins-balance">
              <span className="balance-amount">
                {loyaltyBalance.toLocaleString()}
              </span>
              <span className="balance-label">Available Coins</span>
            </div>
            <div className="balance-value">
              <small>
                Worth ₹{(loyaltyBalance * 0.1).toFixed(2)} • 1 Coin = ₹0.10
              </small>
            </div>
          </div>

          <div className="coins-stats">
            <div className="stat-item">
              <span className="stat-value">{totalEarned.toLocaleString()}</span>
              <span className="stat-label">Total Earned</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {totalRedeemed.toLocaleString()}
              </span>
              <span className="stat-label">Total Redeemed</span>
            </div>
          </div>
        </div>

        {loyaltyError && (
          <div className="error-message">
            <h4>⚠️ AggreCoins Not Available Yet</h4>
            <p>
              Your loyalty account will be created automatically after your
              first order!
            </p>
            <p>Start shopping to earn AggreCoins on every purchase.</p>
          </div>
        )}
      </div>

      {/* Redemption Section - Always Visible */}
      <div className="redemption-section">
        <div className="section-header">
          <h4>💰 Redeem AggreCoins</h4>
          <p>Convert your AggreCoins to cash value for future orders</p>
        </div>

        {loyaltyBalance >= 100 ? (
          <div className="redemption-active">
            <div className="redemption-options">
              <div className="quick-redeem">
                <h5>Quick Redeem Options</h5>
                <div className="quick-buttons">
                  {[100, 500, 1000, 2000]
                    .filter((amount) => amount <= loyaltyBalance)
                    .map((amount) => (
                      <button
                        key={amount}
                        className="quick-redeem-btn"
                        onClick={() => {
                          setRedeemAmount(amount.toString());
                          setShowRedeemModal(true);
                        }}
                      >
                        <span className="coins">{amount} Coins</span>
                        <span className="cash">
                          ₹{(amount * 0.1).toFixed(2)}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              <div className="custom-redeem">
                <h5>Custom Amount</h5>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowRedeemModal(true)}
                  disabled={loyaltyBalance < 100}
                >
                  💰 Redeem Custom Amount
                </button>
              </div>
            </div>

            <div className="redemption-info">
              <h6>How Redemption Works:</h6>
              <ul>
                <li>✅ Minimum redemption: 100 coins (₹10)</li>
                <li>✅ Redeemed amount is added to your wallet</li>
                <li>✅ Use wallet balance for future orders</li>
                <li>✅ Instant processing - no waiting time</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="redemption-inactive">
            <div className="redemption-locked">
              <div className="locked-icon">🔒</div>
              <h5>Redemption Locked</h5>
              <p>
                You need at least <strong>100 AggreCoins</strong> to start
                redeeming
              </p>
              <p>
                Current balance: <strong>{loyaltyBalance} coins</strong>
              </p>
              <p>
                Need <strong>{100 - loyaltyBalance} more coins</strong> to
                unlock redemption
              </p>
            </div>

            <div className="earn-more-tips">
              <h6>💡 How to Earn More Coins:</h6>
              <div className="tips-grid">
                <div className="tip-item">
                  <span className="tip-icon">🛒</span>
                  <div>
                    <strong>Place Orders</strong>
                    <small>Earn 1-2x coins on every purchase</small>
                  </div>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">👥</span>
                  <div>
                    <strong>Refer Friends</strong>
                    <small>Get 100 coins per successful referral</small>
                  </div>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">🎯</span>
                  <div>
                    <strong>Complete Milestones</strong>
                    <small>Bonus coins for achievements</small>
                  </div>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">🎁</span>
                  <div>
                    <strong>Special Promotions</strong>
                    <small>Extra coins during campaigns</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Referral Section */}
      <div className="referral-section">
        <div className="referral-header">
          <h4>🎁 Refer Friends & Earn</h4>
          <p>Earn 100 AggreCoins for each successful referral!</p>
        </div>

        <div className="referral-code">
          <label>Your Referral Code:</label>
          <div className="code-display">
            <span className="code">{referralCode}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralCode);
                toast.success("Referral code copied!");
              }}
              className="btn btn-outline btn-sm"
            >
              📋 Copy
            </button>
          </div>
        </div>

        <form onSubmit={handleReferFriend} className="refer-form">
          <div className="form-row">
            <input
              type="text"
              name="friendName"
              placeholder="Friend's Name"
              value={referralData.friendName}
              onChange={handleReferralChange}
              required
            />
            <input
              type="tel"
              name="friendPhoneNumber"
              placeholder="Friend's Phone (10 digits)"
              value={referralData.friendPhoneNumber}
              onChange={handleReferralChange}
              pattern="[6-9][0-9]{9}"
              maxLength="10"
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={referMutation.isLoading}
            >
              {referMutation.isLoading ? "Sending..." : "📤 Send Invite"}
            </button>
          </div>
        </form>

        {/* Referral Stats */}
        {referralsData?.data && (
          <div className="referral-stats">
            <h5>📊 Your Referral Stats</h5>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">
                  {referralsData.data.totalReferrals || 0}
                </span>
                <span className="stat-label">Total Sent</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {referralsData.data.completedReferrals || 0}
                </span>
                <span className="stat-label">Successful</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {referralsData.data.totalEarnings || 0}
                </span>
                <span className="stat-label">Coins Earned</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {loyaltyData?.data?.recentTransactions?.length > 0 && (
        <div className="recent-transactions">
          <h4>💰 Recent Transactions</h4>
          <div className="transactions-list">
            {loyaltyData.data.recentTransactions
              .slice(0, 5)
              .map((transaction, index) => (
                <div key={index} className="transaction-item">
                  <div className="transaction-info">
                    <span className="transaction-type">
                      {transaction.type === "earned"
                        ? "➕"
                        : transaction.type === "redeemed"
                          ? "➖"
                          : transaction.type === "bonus"
                            ? "🎁"
                            : transaction.type === "referral"
                              ? "👥"
                              : "📝"}
                    </span>
                    <span className="transaction-desc">
                      {transaction.description}
                    </span>
                  </div>
                  <div className="transaction-amount">
                    <span
                      className={
                        transaction.type === "redeemed"
                          ? "negative"
                          : "positive"
                      }
                    >
                      {transaction.type === "redeemed" ? "-" : "+"}
                      {Math.abs(transaction.amount)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRedeemModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 Redeem AggreCoins</h3>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="redeem-info">
                <p>
                  <strong>Available Balance:</strong>{" "}
                  {loyaltyBalance.toLocaleString()} coins
                </p>
                <p>
                  <strong>Exchange Rate:</strong> 1 AggreCoin = ₹0.10
                </p>
                <p>
                  <strong>Minimum Redemption:</strong> 100 coins (₹10)
                </p>
              </div>

              <form onSubmit={handleRedeem} className="redeem-form">
                <div className="form-group">
                  <label>Amount to Redeem (Coins)</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    min="100"
                    max={loyaltyBalance}
                    step="10"
                    required
                  />
                  {redeemAmount && (
                    <div className="conversion-display">
                      <span>
                        {parseInt(redeemAmount || 0).toLocaleString()} coins = ₹
                        {(parseInt(redeemAmount || 0) * 0.1).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowRedeemModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      redeemMutation.isLoading ||
                      !redeemAmount ||
                      parseInt(redeemAmount) < 100
                    }
                  >
                    {redeemMutation.isLoading ? "Redeeming..." : "Redeem Now"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipTab;
