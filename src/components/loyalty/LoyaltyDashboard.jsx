import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  Trophy,
  Gift,
  TrendingUp,
  Users,
  Star,
  ChevronRight,
  Calendar,
  MapPin,
  Award,
  Zap,
  AlertTriangle,
  RefreshCw,
  Crown,
  ShoppingBag,
  IndianRupee,
  Eye,
  UserPlus,
  CheckCircle,
  XCircle,
  Activity,
  Target,
  ArrowDownCircle,
 
  
} from "lucide-react";
import loyaltyService from "../../services/loyaltyService";
import "./LoyaltyDashboard.css";

const LoyaltyDashboard = () => {
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Additional state for tab-specific data
  const [tabData, setTabData] = useState({
    transactions: { data: [], loading: false, error: null },
    programs: { data: [], loading: false, error: null },
    achievements: {
      data: { achievements: [], milestones: [], progress: {} },
      loading: false,
      error: null,
    },
  });

  useEffect(() => {
    fetchLoyaltyDashboard();
  }, []);

  useEffect(() => {
    // Load tab-specific data when tab changes
    if (activeTab !== "overview" && loyaltyData) {
      loadTabData(activeTab);
    }
  }, [activeTab, loyaltyData]);

  const fetchLoyaltyDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        "🔍 LoyaltyDashboard: Fetching customer loyalty dashboard..."
      );
      const result = await loyaltyService.getUserLoyaltyDashboard();
      console.log("✅ LoyaltyDashboard: Dashboard data received:", result);

      if (result) {
        setLoyaltyData(result);
      } else {
        setError("Failed to load loyalty data");
        // Set default data structure to prevent null errors
        setLoyaltyData({
          aggreCoins: { balance: 0, totalEarned: 0, totalRedeemed: 0 },
          membership: {
            currentTier: "silver",
            tierProgress: {
              currentSpent: 0,
              nextTierRequirement: { spent: 25000 },
              progress: 0,
            },
          },
          insights: {
            totalOrders: 0,
            totalSpent: 0,
            averageOrderValue: 0,
            lastOrderDate: null,
          },
          recentTransactions: [],
          availablePrograms: [],
          achievements: [],
          milestones: [],
          referralStats: {
            totalReferrals: 0,
            successfulReferrals: 0,
            referralRewards: 0,
          },
        });
      }
    } catch (error) {
      console.error("❌ LoyaltyDashboard: Error fetching loyalty data:", error);
      setError(error.message || "Failed to load loyalty data");

      // Set default data structure
      setLoyaltyData({
        aggreCoins: { balance: 0, totalEarned: 0, totalRedeemed: 0 },
        membership: {
          currentTier: "silver",
          tierProgress: {
            currentSpent: 0,
            nextTierRequirement: { spent: 25000 },
            progress: 0,
          },
        },
        insights: {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastOrderDate: null,
        },
        recentTransactions: [],
        availablePrograms: [],
        achievements: [],
        milestones: [],
        referralStats: {
          totalReferrals: 0,
          successfulReferrals: 0,
          referralRewards: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };
  const AchievementsTab = ({ data, loading, error, onRefresh }) => {
  if (loading) {
    return (
      <div className="loading-container">
        <RefreshCw className="spin-icon" />
        <p>Loading achievements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle />
        <p>{error}</p>
        <button onClick={onRefresh}>Try Again</button>
      </div>
    );
  }

  const achievements = data?.achievements || [];
  const milestones = data?.milestones || [];
  const progress = data?.progress || {};

  return (
    <div className="achievements-tab">
      <div className="achievements-header">
        <h3>Your Achievements</h3>
        <button onClick={onRefresh} className="refresh-button">
          <RefreshCw />
        </button>
      </div>

      {/* Achievement Badges */}
      <div className="achievements-section">
        <h4>🏆 Achievement Badges</h4>
        <div className="achievements-grid">
          {achievements.length > 0 ? (
            achievements.map((achievement, index) => (
              <div key={index} className="achievement-card">
                <div className="achievement-icon">
                  {achievement === 'welcome_member' && '👋'}
                  {achievement === 'first_order' && '🛒'}
                  {achievement === 'loyal_customer' && '💎'}
                  {achievement === 'referral_master' && '👥'}
                  {achievement === 'big_spender' && '💰'}
                </div>
                <div className="achievement-content">
                  <h5>
                    {achievement === 'welcome_member' && 'Welcome Member'}
                    {achievement === 'first_order' && 'First Order'}
                    {achievement === 'loyal_customer' && 'Loyal Customer'}
                    {achievement === 'referral_master' && 'Referral Master'}
                    {achievement === 'big_spender' && 'Big Spender'}
                  </h5>
                  <p>
                    {achievement === 'welcome_member' && 'Joined Aggrekart loyalty program'}
                    {achievement === 'first_order' && 'Completed your first order'}
                    {achievement === 'loyal_customer' && 'Multiple successful orders'}
                    {achievement === 'referral_master' && 'Successful referrals'}
                    {achievement === 'big_spender' && 'High value orders'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Trophy />
              <p>No achievements yet</p>
              <small>Start shopping to earn your first achievement!</small>
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div className="milestones-section">
        <h4>🎯 Milestones Reached</h4>
        <div className="milestones-grid">
          {milestones.length > 0 ? (
            milestones.map((milestone, index) => (
              <div key={index} className="milestone-card">
                <div className="milestone-icon">
                  {milestone.type === 'first_order' && '🎉'}
                  {milestone.type === 'orders_5' && '📦'}
                  {milestone.type === 'orders_20' && '🚚'}
                  {milestone.type === 'orders_50' && '🏆'}
                  {milestone.type === 'orders_100' && '👑'}
                  {milestone.type === 'value_10k' && '💰'}
                  {milestone.type === 'value_50k' && '💎'}
                  {milestone.type === 'value_100k' && '🌟'}
                </div>
                <div className="milestone-content">
                  <h5>
                    {milestone.type === 'first_order' && 'First Order'}
                    {milestone.type === 'orders_5' && '5 Orders'}
                    {milestone.type === 'orders_20' && '20 Orders'}
                    {milestone.type === 'orders_50' && '50 Orders'}
                    {milestone.type === 'orders_100' && '100 Orders'}
                    {milestone.type === 'value_10k' && '₹10,000 Spent'}
                    {milestone.type === 'value_50k' && '₹50,000 Spent'}
                    {milestone.type === 'value_100k' && '₹1,00,000 Spent'}
                  </h5>
                  <p>Reward: {milestone.rewardEarned} AggreCoins</p>
                  <small>
                    Achieved on {new Date(milestone.achievedAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Target />
              <p>No milestones reached yet</p>
              <small>Complete orders to reach your first milestone!</small>
            </div>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="progress-section">
        <h4>📊 Your Progress</h4>
        <div className="progress-stats">
          <div className="progress-stat">
            <div className="stat-icon">
              <Coins />
            </div>
            <div className="stat-content">
              <h5>{progress.totalEarned || 0}</h5>
              <p>Total Coins Earned</p>
            </div>
          </div>
          
          <div className="progress-stat">
            <div className="stat-icon">
              <ArrowDownCircle />
            </div>
            <div className="stat-content">
              <h5>{progress.totalRedeemed || 0}</h5>
              <p>Total Coins Redeemed</p>
            </div>
          </div>
          
          <div className="progress-stat">
            <div className="stat-icon">
              <Users />
            </div>
            <div className="stat-content">
              <h5>{progress.referralCount || 0}</h5>
              <p>Successful Referrals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


  // Update the loadTabData function around line 299
const loadTabData = async (tab) => {
    // For achievements tab, allow refresh by clearing existing data first
    if (tab === 'achievements' && tabData[tab]?.data) {
      setTabData((prev) => ({
        ...prev,
        achievements: {
          data: { achievements: [], milestones: [], progress: {} },
          loading: false,
          error: null,
        },
      }));
    }

    // Don't reload if data is already loaded (except achievements which we handle above)
    if (tabData[tab]?.data?.length > 0 || tabData[tab]?.loading) {
      if (tab !== 'achievements') {
        return;
      }
    }

    setTabData((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], loading: true, error: null },
    }));

    try {
      let result;
      switch (tab) {
        case "transactions":
          console.log('🔍 Loading transactions data...');
          result = await loyaltyService.getUserLoyaltyHistory(1, 20);
          setTabData((prev) => ({
            ...prev,
            transactions: {
              data:
                result?.transactions || loyaltyData?.recentTransactions || [],
              loading: false,
              error: null,
            },
          }));
          break;

        case "programs":
          console.log('🔍 Loading programs data...');
          result = await loyaltyService.getAvailableLoyaltyPrograms();
          setTabData((prev) => ({
            ...prev,
            programs: {
              data: result || loyaltyData?.availablePrograms || [],
              loading: false,
              error: null,
            },
          }));
          break;

        case "achievements":
          console.log('🔍 Loading achievements data...');
          result = await loyaltyService.getUserAchievements();
          console.log('✅ Achievements data received:', result);
          
          // Ensure we have valid data structure
          const achievementsData = {
            achievements: result?.achievements || ['welcome_member'],
            milestones: result?.milestones || [],
            progress: result?.progress || {
              totalEarned: loyaltyData?.aggreCoins?.totalEarned || 0,
              totalRedeemed: loyaltyData?.aggreCoins?.totalRedeemed || 0,
              referralCount: loyaltyData?.referralStats?.totalReferrals || 0,
            }
          };

          setTabData((prev) => ({
            ...prev,
            achievements: {
              data: achievementsData,
              loading: false,
              error: null,
            },
          }));
          break;

        default:
          console.log(`Tab ${tab} data loading not implemented`);
          setTabData((prev) => ({
            ...prev,
            [tab]: { ...prev[tab], loading: false },
          }));
      }
    } catch (error) {
      console.error(`❌ Error loading ${tab} data:`, error);
      setTabData((prev) => ({
        ...prev,
        [tab]: {
          data:
            tab === "achievements"
              ? { 
                  achievements: ['welcome_member'], 
                  milestones: [], 
                  progress: {
                    totalEarned: loyaltyData?.aggreCoins?.totalEarned || 0,
                    totalRedeemed: loyaltyData?.aggreCoins?.totalRedeemed || 0,
                    referralCount: loyaltyData?.referralStats?.totalReferrals || 0,
                  }
                }
              : [],
          loading: false,
          error: error.message,
        },
      }));
    }
  };

// ...existing code...
  const redeemCoins = async (amount, redeemType = "discount") => {
    try {
      setLoading(true);
      const result = await loyaltyService.redeemLoyaltyCoins(
        amount,
        redeemType,
        loyaltyData?.customerMetrics?.totalSpent || 0
      );

      if (result) {
        // Refresh dashboard data after redemption
        await fetchLoyaltyDashboard();
        return result;
      }
    } catch (error) {
      console.error("Error redeeming coins:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (loading && !loyaltyData) {
    return (
      <div className="loyalty-dashboard">
        <div className="loading-container">
          <div className="loading-spinner">
            <RefreshCw className="spin-icon" />
          </div>
          <p>Loading your loyalty dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !loyaltyData) {
    return (
      <div className="loyalty-dashboard">
        <div className="error-container">
          <AlertTriangle className="error-icon" />
          <h3>Unable to Load Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchLoyaltyDashboard} className="retry-button">
            <RefreshCw /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="loyalty-dashboard">
      <div className="dashboard-header">
        <h1>My Loyalty Dashboard</h1>
        <p>Welcome back! Here's your loyalty status and rewards.</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="stats-grid">
        <motion.div
          className="stat-card coins"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="stat-icon">
            <Coins />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {loyaltyData?.aggreCoins?.balance || 0}
            </div>
            <div className="stat-label">AggreCoins Balance</div>
            <div className="stat-subtext">
              +
              {loyaltyData?.aggreCoins?.totalEarned -
                loyaltyData?.aggreCoins?.totalRedeemed || 0}{" "}
              this month
            </div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card tier"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="stat-icon">
            <Trophy />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {loyaltyData?.membership?.currentTier || "Silver"}
            </div>
            <div className="stat-label">Membership Tier</div>
            <div className="stat-subtext">
              {loyaltyData?.membership?.tierProgress?.isMaxTier
                ? "Maximum tier reached"
                : loyaltyData?.membership?.tierProgress?.nextTier
                  ? `Next: ${loyaltyData.membership.tierProgress.nextTier}`
                  : "Keep shopping to advance!"}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card orders"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="stat-icon">
            <ShoppingBag />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {loyaltyData?.customerMetrics?.totalOrders || 0}
            </div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-subtext">Lifetime orders</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card spending"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="stat-icon">
            <IndianRupee />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              ₹{loyaltyData?.customerMetrics?.totalSpent?.toLocaleString() || 0}
            </div>
            <div className="stat-label">Total Spent</div>
            <div className="stat-subtext">Lifetime spending</div>
          </div>
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        {["overview", "transactions", "programs", "achievements"].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <OverviewTab loyaltyData={loyaltyData} onRedeem={redeemCoins} />
        )}
        {activeTab === "transactions" && (
          <TransactionsTab
            data={tabData.transactions.data}
            loading={tabData.transactions.loading}
            error={tabData.transactions.error}
            onRefresh={() => loadTabData("transactions")}
          />
        )}
        {activeTab === "programs" && (
          <ProgramsTab
            data={tabData.programs.data}
            loading={tabData.programs.loading}
            error={tabData.programs.error}
            onRefresh={() => loadTabData("programs")}
          />
        )}
        {activeTab === "achievements" && (
          <AchievementsTab
            data={tabData.achievements.data}
            loading={tabData.achievements.loading}
            error={tabData.achievements.error}
            onRefresh={() => loadTabData("achievements")}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ loyaltyData, onRedeem }) => {
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);

  const handleRedeem = async () => {
    if (!redeemAmount || redeemAmount <= 0) {
      alert("Please enter a valid coin amount");
      return;
    }

    if (redeemAmount > loyaltyData?.aggreCoins?.balance) {
      alert("Insufficient coin balance");
      return;
    }

    try {
      setRedeemLoading(true);
      await onRedeem(parseInt(redeemAmount));
      setRedeemAmount("");
      alert("Coins redeemed successfully!");
    } catch (error) {
      alert(`Redemption failed: ${error.message}`);
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className="overview-tab">
      {/* Tier Progress */}
      <div className="tier-progress-card">
        <h3>Membership Progress</h3>
        <div className="tier-info">
          <div className="current-tier">
            <Crown />
            <span>{loyaltyData?.membership?.currentTier || "Silver"}</span>
          </div>
          {!loyaltyData?.membership?.tierProgress?.isMaxTier && (
            <div className="progress-info">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${loyaltyData?.membership?.tierProgress?.progressPercentage || 0}%`,
                  }}
                />
              </div>
              <p>
                {loyaltyData?.membership?.tierProgress?.spendingNeeded
                  ? `Spend ₹${loyaltyData.membership.tierProgress.spendingNeeded.toLocaleString()} more to reach ${loyaltyData.membership.tierProgress.nextTier}`
                  : `Progress: ${loyaltyData?.membership?.tierProgress?.progressPercentage || 0}%`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Coin Redemption */}
      <div className="redemption-card">
        <h3>Redeem AggreCoins</h3>
        <div className="redemption-form">
          <div className="balance-info">
            <Coins />
            <span>
              Available: {loyaltyData?.aggreCoins?.balance || 0} coins
            </span>
          </div>
          <div className="redemption-input">
            <input
              type="number"
              placeholder="Enter coins to redeem"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
              max={loyaltyData?.aggreCoins?.balance || 0}
              min="1"
            />
            <button
              onClick={handleRedeem}
              disabled={redeemLoading}
              className="redeem-button"
            >
              {redeemLoading ? <RefreshCw className="spin-icon" /> : "Redeem"}
            </button>
          </div>
          <p className="redemption-note">
            1 AggreCoin = ₹1 discount on your next order
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity-card">
        <h3>Recent Transactions</h3>
        <div className="transactions-list">
          {loyaltyData?.recentTransactions?.length > 0 ? (
            loyaltyData.recentTransactions
              .slice(0, 5)
              .map((transaction, index) => (
                <div key={index} className="transaction-item">
                  <div className="transaction-icon">
                    {transaction.type === "earned" ? <TrendingUp /> : <Coins />}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-description">
                      {transaction.description}
                    </div>
                    <div className="transaction-date">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === "earned" ? "+" : "-"}
                    {transaction.amount}
                  </div>
                </div>
              ))
          ) : (
            <div className="empty-state">
              <Activity />
              <p>No recent transactions</p>
            </div>
          )}
        </div>
      </div>

      {/* Available Programs */}
      <div className="programs-card">
        <h3>Available Programs</h3>
        <div className="programs-list">
          {loyaltyData?.availablePrograms?.length > 0 ? (
            loyaltyData.availablePrograms.slice(0, 3).map((program, index) => (
              <div key={index} className="program-item">
                <div className="program-icon">
                  <Gift />
                </div>
                <div className="program-details">
                  <div className="program-name">{program.name}</div>
                  <div className="program-description">
                    {program.description}
                  </div>
                </div>
                <button
                  className="program-button"
                  onClick={async () => {
                    try {
                      console.log(
                        "🔍 Joining program from overview:",
                        program._id
                      ); // Added debug log
                      await loyaltyService.joinLoyaltyProgram(program._id); // Changed from program.id
                      alert(`Successfully joined ${program.name}!`);
                      // Refresh dashboard
                      await fetchLoyaltyDashboard();
                    } catch (error) {
                      alert(`Failed to join program: ${error.message}`);
                    }
                  }}
                >
                  <UserPlus size={16} />
                  Join
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Gift />
              <p>No programs available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Transactions Tab Component
const TransactionsTab = ({ data, loading, error, onRefresh }) => {
  if (loading) {
    return (
      <div className="loading-container">
        <RefreshCw className="spin-icon" />
        <p>Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle />
        <p>{error}</p>
        <button onClick={onRefresh}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="transactions-tab">
      <div className="transactions-header">
        <h3>Transaction History</h3>
        <button onClick={onRefresh} className="refresh-button">
          <RefreshCw />
        </button>
      </div>

      <div className="transactions-list">
        {data?.length > 0 ? (
          data.map((transaction, index) => (
            <div key={index} className="transaction-item">
              <div className="transaction-icon">
                {transaction.type === "earned" ? <TrendingUp /> : <Coins />}
              </div>
              <div className="transaction-details">
                <div className="transaction-description">
                  {transaction.description}
                </div>
                <div className="transaction-date">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className={`transaction-amount ${transaction.type}`}>
                {transaction.type === "earned" ? "+" : "-"}
                {transaction.amount}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Activity />
            <p>No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Programs Tab Component - Enhanced with Join Functionality
const ProgramsTab = ({ data, loading, error, onRefresh }) => {
  const [joiningProgram, setJoiningProgram] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showProgramModal, setShowProgramModal] = useState(false);

  const handleJoinProgram = async (programId) => {
    try {
      setJoiningProgram(programId);
      console.log("🔍 Joining program:", programId);

      const result = await loyaltyService.joinLoyaltyProgram(programId);

      if (result) {
        alert(
          `✅ ${result.message}\n${
            result.welcomeBonus > 0
              ? `Welcome bonus: ${result.welcomeBonus} coins!`
              : ""
          }`
        );
        // Refresh the programs list
        onRefresh();
      }
    } catch (error) {
      console.error("❌ Join program error:", error);
      alert(`Failed to join program: ${error.message}`);
    } finally {
      setJoiningProgram(null);
    }
  };
  

  const handleViewProgram = async (programId) => {
    try {
      console.log("🔍 Loading program details:", programId);
      const programDetails = await fetch(`/api/loyalty/programs/${programId}`, {
        headers: {
          Authorization: `Bearer ${document.cookie.replace(
            /(?:(?:^|.*;\s*)aggrekart_token\s*\=\s*([^;]*).*$)|^.*$/,
            "$1"
          )}`,
        },
      });
      const result = await programDetails.json();

      if (result.success) {
        setSelectedProgram(result.data);
        setShowProgramModal(true);
      }
    } catch (error) {
      console.error("❌ Error loading program details:", error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <RefreshCw className="spin-icon" />
        <p>Loading programs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle />
        <p>{error}</p>
        <button onClick={onRefresh}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="programs-tab">
      <div className="programs-header">
        <h3>Available Programs</h3>
        <button onClick={onRefresh} className="refresh-button">
          <RefreshCw />
        </button>
      </div>

      <div className="programs-grid">
        {data?.length > 0 ? (
          data.map((program) => (
            <div key={program._id} className="program-card">
              <div className="program-icon">
                <Gift />
              </div>
              <div className="program-content">
                <h4>{program.name}</h4>
                <p>{program.description}</p>
                <div className="program-meta">
                  <span className="program-type">{program.type}</span>
                  {program.rewards && program.rewards.value && (
                    <span className="program-reward">
                      Earn up to {program.rewards.value} coins
                    </span>
                  )}
                </div>
              </div>
              <div className="program-actions">
                <button
                  onClick={() => {
                    console.log("🔍 Viewing program details:", program._id); // Added debug log
                    handleViewProgram(program._id); // Changed from program.id
                  }}
                  className="view-button"
                >
                  <Eye size={16} />
                  View Details
                </button>
                <button
                  onClick={() => {
                    console.log("🔍 Joining program from tab:", program._id); // Added debug log
                    handleJoinProgram(program._id); // Changed from program.id
                  }}
                  disabled={joiningProgram === program._id} // Changed from program.id
                  className="join-button"
                >
                  {joiningProgram === program._id ? ( // Changed from program.id
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Join Program
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Gift />
            <p>No programs available</p>
          </div>
        )}
      </div>

      {/* Program Details Modal */}
      {showProgramModal && selectedProgram && (
        <ProgramModal
          program={selectedProgram}
          isOpen={showProgramModal}
          onClose={() => setShowProgramModal(false)}
          onJoin={handleJoinProgram}
          isJoining={joiningProgram === selectedProgram._id} // Changed from selectedProgram.id
        />
      )}
    </div>
  );
};

// New Program Modal Component
const ProgramModal = ({ program, onClose, onJoin, isJoining }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="program-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{program.name}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="program-details">
            <div className="program-type-badge">
              {program.type.replace("_", " ").toUpperCase()}
            </div>

            <div className="program-description">
              <p>{program.description}</p>
            </div>

            {program.rewards && (
              <div className="program-rewards">
                <h4>Rewards & Benefits</h4>
                <div className="reward-item">
                  <Coins />
                  <span>
                    {program.rewards.type === "percentage"
                      ? `${program.rewards.value}% discount on orders`
                      : program.rewards.type === "coins"
                        ? `Earn ${program.rewards.value} coins`
                        : `₹${program.rewards.value} reward`}
                  </span>
                </div>
                {program.rewards.maxDiscount && (
                  <div className="reward-limit">
                    <span>
                      Maximum discount: ₹{program.rewards.maxDiscount}
                    </span>
                  </div>
                )}
              </div>
            )}

            {program.conditions && (
              <div className="program-conditions">
                <h4>Program Conditions</h4>
                {program.conditions.minOrderValue > 0 && (
                  <div className="condition-item">
                    <IndianRupee />
                    <span>
                      Minimum order value: ₹
                      {program.conditions.minOrderValue.toLocaleString()}
                    </span>
                  </div>
                )}
                {program.conditions.validTill && (
                  <div className="condition-item">
                    <Calendar />
                    <span>
                      Valid until:{" "}
                      {new Date(
                        program.conditions.validTill
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {program.supplier && (
              <div className="program-supplier">
                <h4>Offered by</h4>
                <p>
                  {program.supplier.businessName ||
                    program.supplier.companyName}
                </p>
              </div>
            )}

            {/* Eligibility Status */}
            <div className="eligibility-status">
              {program.eligibility?.eligible ? (
                <div className="eligible">
                  <CheckCircle />
                  <span>You are eligible for this program</span>
                </div>
              ) : (
                <div className="not-eligible">
                  <XCircle />
                  <span>
                    {program.eligibility?.reason ||
                      "Not eligible for this program"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {program.eligibility?.eligible && !program.isEnrolled && (
            <button
              className="btn-primary"
              onClick={() => onJoin(program._id)} // Changed from program.id
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <RefreshCw className="spin-icon" />
                  Joining...
                </>
              ) : (
                <>
                  <UserPlus />
                  Join Program
                </>
              )}
            </button>
          )}
          {program.isEnrolled && (
            <div className="enrolled-badge">
              <CheckCircle />
              <span>Already Enrolled</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyDashboard;
