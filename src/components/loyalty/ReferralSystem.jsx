import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Gift,
  Copy,
  Share2,
  CheckCircle,
  Clock,
  Coins,
  Star,
  Trophy,
  MessageCircle,
} from "lucide-react";
import "./ReferralSystem.css";

const ReferralSystem = () => {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [showReferralInput, setShowReferralInput] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await fetch("/api/loyalty/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setReferralData(data.data.referralStats);
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    const code = "AGK123456"; // This should come from your loyalty data
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const shareReferral = async () => {
    const code = "AGK123456";
    const message = `Join AggreKart using my referral code: ${code} and get 100 AggreCoins bonus! 🎉`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join AggreKart",
          text: message,
          url: `https://aggrekart.com/register?ref=${code}`,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback for browsers without Web Share API
      await navigator.clipboard.writeText(message);
      alert("Referral message copied to clipboard!");
    }
  };

  const handleReferralSubmit = async () => {
    if (!referralCode.trim()) {
      alert("Please enter a referral code");
      return;
    }

    try {
      const response = await fetch("/api/loyalty/referral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          referralCode: referralCode.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `Success! You've earned ${data.data.bonusAwarded} AggreCoins from the referral!`
        );
        setReferralCode("");
        setShowReferralInput(false);
        fetchReferralData();
      } else {
        alert(data.message || "Invalid referral code");
      }
    } catch (error) {
      alert("Error processing referral code");
    }
  };

  if (loading) {
    return (
      <div className="referral-loading">
        <div className="loading-spinner"></div>
        <p>Loading referral information...</p>
      </div>
    );
  }

  return (
    <div className="referral-system">
      {/* Header */}
      <motion.div
        className="referral-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="referral-icon-container">
          <Gift className="referral-main-icon" />
        </div>
        <h2>Refer Friends & Earn Rewards</h2>
        <p>Share AggreKart with friends and both of you get 100 AggreCoins!</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="referral-stats">
        <motion.div
          className="stat-card friends-referred"
          whileHover={{ scale: 1.02 }}
        >
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-content">
            <h3>{referralData?.totalReferrals || 0}</h3>
            <p>Friends Referred</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card successful-referrals"
          whileHover={{ scale: 1.02 }}
        >
          <div className="stat-icon success">
            <CheckCircle />
          </div>
          <div className="stat-content">
            <h3>{referralData?.successfulReferrals || 0}</h3>
            <p>Successful Referrals</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card pending-referrals"
          whileHover={{ scale: 1.02 }}
        >
          <div className="stat-icon pending">
            <Clock />
          </div>
          <div className="stat-content">
            <h3>{referralData?.pendingReferrals || 0}</h3>
            <p>Pending Referrals</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card coins-earned"
          whileHover={{ scale: 1.02 }}
        >
          <div className="stat-icon coins">
            <Coins />
          </div>
          <div className="stat-content">
            <h3>{(referralData?.successfulReferrals || 0) * 100}</h3>
            <p>Coins Earned</p>
          </div>
        </motion.div>
      </div>

      {/* Referral Code Section */}
      <motion.div
        className="referral-code-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3>Your Referral Code</h3>
        <div className="referral-code-container">
          <div className="referral-code">
            <span className="code-label">Code:</span>
            <span className="code-value">AGK123456</span>
          </div>

          <div className="referral-actions">
            <button
              className={`copy-btn ${copied ? "copied" : ""}`}
              onClick={copyReferralCode}
            >
              {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              {copied ? "Copied!" : "Copy"}
            </button>

            <button className="share-btn" onClick={shareReferral}>
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div
        className="how-it-works"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3>How Referral Works</h3>
        <div className="steps-container">
          <div className="step">
            <div className="step-icon">
              <Share2 />
            </div>
            <div className="step-content">
              <h4>Share Your Code</h4>
              <p>
                Send your unique referral code to friends via WhatsApp, SMS, or
                social media
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-icon">
              <Users />
            </div>
            <div className="step-content">
              <h4>Friend Signs Up</h4>
              <p>Your friend creates an account using your referral code</p>
            </div>
          </div>

          <div className="step">
            <div className="step-icon">
              <Trophy />
            </div>
            <div className="step-content">
              <h4>Both Get Rewards</h4>
              <p>
                You both receive 100 AggreCoins once they place their first
                order
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enter Referral Code */}
      <motion.div
        className="enter-referral-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3>Have a Referral Code?</h3>
        <p>Enter a friend's referral code to earn bonus coins</p>

        {!showReferralInput ? (
          <button
            className="show-input-btn"
            onClick={() => setShowReferralInput(true)}
          >
            <Gift size={18} />
            Enter Referral Code
          </button>
        ) : (
          <div className="referral-input-container">
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter referral code (e.g., AGK123456)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="referral-input"
              />
              <button
                className="submit-referral-btn"
                onClick={handleReferralSubmit}
              >
                <CheckCircle size={18} />
                Submit
              </button>
            </div>
            <button
              className="cancel-btn"
              onClick={() => {
                setShowReferralInput(false);
                setReferralCode("");
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </motion.div>

      {/* Referral Benefits */}
      <motion.div
        className="referral-benefits"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3>Referral Benefits</h3>
        <div className="benefits-grid">
          <div className="benefit-item">
            <Star className="benefit-icon" />
            <div className="benefit-content">
              <h4>Instant Rewards</h4>
              <p>
                Get 100 AggreCoins immediately when your friend places their
                first order
              </p>
            </div>
          </div>

          <div className="benefit-item">
            <Coins className="benefit-icon" />
            <div className="benefit-content">
              <h4>No Limits</h4>
              <p>Refer unlimited friends and keep earning coins</p>
            </div>
          </div>

          <div className="benefit-item">
            <Gift className="benefit-icon" />
            <div className="benefit-content">
              <h4>Win-Win</h4>
              <p>Both you and your friend get rewards when they join</p>
            </div>
          </div>

          <div className="benefit-item">
            <MessageCircle className="benefit-icon" />
            <div className="benefit-content">
              <h4>Easy Sharing</h4>
              <p>Share via WhatsApp, SMS, or any social media platform</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Share Options */}
      <motion.div
        className="quick-share"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3>Quick Share Options</h3>
        <div className="share-buttons">
          <button
            className="share-option whatsapp"
            onClick={() => {
              const message = `Join AggreKart using my code AGK123456 and get 100 free coins! 🎉`;
              window.open(
                `https://wa.me/?text=${encodeURIComponent(message)}`,
                "_blank"
              );
            }}
          >
            <MessageCircle size={20} />
            WhatsApp
          </button>

          <button
            className="share-option sms"
            onClick={() => {
              const message = `Join AggreKart using my code AGK123456 and get 100 free coins!`;
              window.open(`sms:?body=${encodeURIComponent(message)}`, "_blank");
            }}
          >
            <MessageCircle size={20} />
            SMS
          </button>

          <button className="share-option copy-link" onClick={copyReferralCode}>
            <Copy size={20} />
            Copy Link
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReferralSystem;
