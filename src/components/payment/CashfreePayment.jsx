import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { paymentsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "./CashfreePayment.css";

const CashfreePayment = ({ orderData, onSuccess, onError, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadCashfreeScript();
  }, []);

  useEffect(() => {
    if (scriptLoaded && orderData && user) {
      // Auto-initiate payment when component mounts
      handlePayment();
    }
  }, [scriptLoaded, orderData, user]);

  const loadCashfreeScript = () => {
    if (window.Cashfree) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error("Failed to load Cashfree SDK");
      toast.error("Payment system failed to load");
      onError && onError({ message: "SDK load failed" });
    };
    document.body.appendChild(script);
  };

  const handlePayment = async () => {
    if (!scriptLoaded || !orderData || !user) {
      return;
    }

    setIsProcessing(true);

    try {
      console.log("🔒 Creating Cashfree payment order...");

      // Create payment order with your backend
      const response = await paymentsAPI.createCashfreeOrder({
        orderId: orderData.orderId,
        amount: parseFloat(
          (orderData.payment?.advanceAmount || orderData.totalAmount).toFixed(2)
        ), // Ensure proper decimal formatting
      });

      console.log("🔒 Cashfree order response:", response);

      if (!response.success) {
        throw new Error(response.message || "Failed to create payment order");
      }

      const { payment_session_id, appId, environment } = response.data;

      // Initialize Cashfree
      const cashfree = new window.Cashfree({
        mode: environment === "PROD" ? "production" : "sandbox",
      });

      console.log("🔒 Opening Cashfree checkout...");

      // Open Cashfree checkout
      const result = await cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_modal",
      });

      console.log("🔒 Cashfree checkout result:", result);

      if (result.error) {
        throw new Error(result.error.message || "Payment failed");
      }

      if (
        result.paymentDetails &&
        result.paymentDetails.paymentStatus === "SUCCESS"
      ) {
        console.log("✅ Payment successful:", result.paymentDetails);

        // Verify payment with backend
        const verifyResponse = await paymentsAPI.verifyCashfreePayment({
          cashfree_order_id: result.paymentDetails.orderID,
          cashfree_payment_id: result.paymentDetails.paymentID,
          orderId: orderData.orderId,
        });

        if (verifyResponse.success) {
          toast.success("Payment completed successfully!");
          onSuccess &&
            onSuccess({
              orderId: orderData.orderId,
              paymentId: result.paymentDetails.paymentID,
              transactionId: result.paymentDetails.paymentID,
              amount: orderData.payment?.advanceAmount || orderData.totalAmount,
              status: "success",
            });
        } else {
          throw new Error("Payment verification failed");
        }
      } else {
        throw new Error("Payment was not completed");
      }
    } catch (error) {
      console.error("❌ Cashfree payment error:", error);
      setIsProcessing(false);
      toast.error(error.message || "Payment failed");
      onError && onError(error);
    }
  };

  return (
    <div className="payment-overlay">
      <div className="payment-modal">
        <div className="payment-content">
          <Loader2 className="loading-spinner" />
          <h3>Processing Payment...</h3>
          <p>Please wait while we redirect you to Cashfree</p>
          <div className="payment-details">
            <p>
              <strong>Order:</strong> {orderData?.orderId}
            </p>
            <p>
              <strong>Amount:</strong> ₹
              {orderData?.payment?.advanceAmount || orderData?.totalAmount}
            </p>
          </div>
          <button onClick={onCancel} className="cancel-btn">
            Cancel Payment
          </button>
        </div>
      </div>

      <style jsx>{`
        .payment-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .payment-modal {
          background: white;
          padding: 40px;
          border-radius: 12px;
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          margin: 0 auto 20px;
          color: #3b82f6;
          animation: spin 1s linear infinite;
        }

        .payment-content h3 {
          margin: 0 0 10px;
          color: #1f2937;
        }

        .payment-content p {
          margin: 0 0 20px;
          color: #6b7280;
        }

        .payment-details {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }

        .payment-details p {
          margin: 5px 0;
          font-size: 14px;
        }

        .cancel-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .cancel-btn:hover {
          background: #e5e7eb;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default CashfreePayment;
