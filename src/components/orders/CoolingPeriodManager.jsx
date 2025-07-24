import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ordersAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import './CoolingPeriodManager.css'

const CoolingPeriodManager = ({ orderId, onCoolingComplete }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [timeLeft, setTimeLeft] = useState({})
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const coolingCompleteTriggered = useRef(false) // PREVENT REPEATED CALLBACKS

  // Fetch order details - REDUCED REFRESH RATE
  const { data: orderData, isLoading } = useQuery(
    ['order', orderId],
    () => ordersAPI.getOrder(orderId),
    {
      enabled: !!orderId,
      refetchInterval: 60000, // CHANGED: Refresh every 1 minute instead of 30 seconds
      refetchIntervalInBackground: false, // Don't refetch when tab is not active
      staleTime: 30000, // Consider data fresh for 30 seconds
    }
  )

  // Cancel order mutation
  const cancelOrderMutation = useMutation(
    (data) => ordersAPI.cancelOrder(orderId, data),
    {
      onSuccess: () => {
        toast.success('Order cancelled successfully!')
        setShowCancelModal(false)
        queryClient.invalidateQueries(['order', orderId])
        queryClient.invalidateQueries('orders')
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to cancel order')
      }
    }
  )

  const order = orderData?.data?.order

  // Calculate cooling period countdown - FIXED TO PREVENT REPEATED CALLBACKS
  useEffect(() => {
    if (!order?.coolingPeriod) return

    const calculateTimeLeft = () => {
      const now = new Date()
      const endTime = new Date(order.coolingPeriod.endTime)
      const timeDiff = endTime - now

      if (timeDiff <= 0 || !order.coolingPeriod.isActive) {
        setTimeLeft({ expired: true })
        
        // FIXED: Only trigger callback once
        if (onCoolingComplete && !coolingCompleteTriggered.current) {
          coolingCompleteTriggered.current = true
          onCoolingComplete()
        }
        return
      }

      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

      setTimeLeft({
        total: timeDiff,
        hours,
        minutes,
        seconds,
        endTime
      })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [order, onCoolingComplete])

  // Reset trigger when order changes
  useEffect(() => {
    if (order?.status !== 'pending' && order?.status !== 'preparing') {
      coolingCompleteTriggered.current = false
    }
  }, [order?.status])

  // Calculate current deduction percentage
  const getCurrentDeduction = () => {
    if (!order?.coolingPeriod) return 0
    
    const startTime = new Date(order.coolingPeriod.startTime)
    const endTime = new Date(order.coolingPeriod.endTime)
    const now = new Date()
    
    const timeElapsed = now - startTime
    const totalCoolingTime = endTime - startTime
    const elapsedPercentage = (timeElapsed / totalCoolingTime) * 100
    
    return elapsedPercentage <= 50 ? 1 : 2
  }

  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation')
      return
    }

    cancelOrderMutation.mutate({
      reason: cancelReason,
      requestedBy: user._id
    })
  }

  // Don't render if cooling period is not active or expired
  if (!order?.coolingPeriod?.isActive || timeLeft.expired) {
    return null
  }

  return (
    <div className="cooling-period-manager">
      <div className="cooling-period-card">
        <div className="cooling-header">
          <div className="cooling-icon">⏰</div>
          <div className="cooling-info">
            <h3>2-Hour Cooling Period</h3>
            <p>Order #{order.orderId || order._id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        <div className="cooling-timer">
          <div className="time-display">
            <div className="time-unit">
              <span className="time-number">{String(timeLeft.hours || 0).padStart(2, '0')}</span>
              <span className="time-label">Hours</span>
            </div>
            <div className="time-separator">:</div>
            <div className="time-unit">
              <span className="time-number">{String(timeLeft.minutes || 0).padStart(2, '0')}</span>
              <span className="time-label">Minutes</span>
            </div>
            <div className="time-separator">:</div>
            <div className="time-unit">
              <span className="time-number">{String(timeLeft.seconds || 0).padStart(2, '0')}</span>
              <span className="time-label">Seconds</span>
            </div>
          </div>
        </div>

        <div className="cooling-details">
          <div className="deduction-info">
            <span className="deduction-rate">Current cancellation fee: {getCurrentDeduction()}%</span>
            <span className="deduction-note">
              • First hour: 1% deduction
              • Second hour: 2% deduction
            </span>
          </div>
        </div>

        <div className="cooling-actions">
          <button 
            onClick={() => setShowCancelModal(true)}
            className="btn btn-outline btn-danger"
            disabled={cancelOrderMutation.isLoading}
          >
            Cancel Order
          </button>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Cancel Order</h3>
              <button 
                onClick={() => setShowCancelModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to cancel this order?</p>
              <p className="cancellation-fee">
                <strong>Cancellation fee: {getCurrentDeduction()}%</strong>
              </p>

              <div className="form-group">
                <label>Reason for cancellation (required):</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  rows="4"
                  className="form-control"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="btn btn-outline"
              >
                Keep Order
              </button>
              <button 
                onClick={handleCancelOrder}
                className="btn btn-danger"
                disabled={cancelOrderMutation.isLoading || !cancelReason.trim()}
              >
                {cancelOrderMutation.isLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoolingPeriodManager