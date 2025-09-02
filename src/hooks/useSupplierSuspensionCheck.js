import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supplierAPI } from '../services/api';
import api from '../services/api'; // Add this import at the top

export const useSupplierSuspensionCheck = () => {
  const { user, logout } = useAuth();
  const [statusData, setStatusData] = useState(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusType, setStatusType] = useState(null); // 'suspended' or 'pending'

  // CHECK SUPPLIER STATUS ON EVERY PAGE LOAD/USER CHANGE
  useEffect(() => {
    const checkSupplierStatus = async () => {
      if (user?.role === 'supplier') {
        try {
          // This will trigger the middleware check immediately
          await supplierAPI.getProfile();
        } catch (error) {
          if (error.response?.status === 403) {
            const errorType = error.response?.data?.error;
            
            // Handle both suspended and pending approval
            if (errorType === 'SUPPLIER_SUSPENDED') {
              console.log('🚫 Supplier suspended detected:', error.response.data);
              setStatusType('suspended');
              setStatusData(error.response.data.data);
              setShowStatusDialog(true);
            } else if (errorType === 'SUPPLIER_PENDING_APPROVAL') {
              console.log('⏳ Supplier pending approval detected:', error.response.data);
              setStatusType('pending');
              setStatusData(error.response.data.data);
              setShowStatusDialog(true);
            }
          }
        }
      }
    };

    // Check immediately when user logs in or changes
    checkSupplierStatus();
  }, [user]);

  // Set up axios interceptor for future API calls
  useEffect(() => {
    const setupInterceptor = () => {
      const interceptor = api.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 403) {
            const errorType = error.response?.data?.error;
            
            // Handle both error types in interceptor too
            if (errorType === 'SUPPLIER_SUSPENDED') {
              console.log('🚫 Suspension intercepted:', error.response.data);
              setStatusType('suspended');
              setStatusData(error.response.data.data);
              setShowStatusDialog(true);
            } else if (errorType === 'SUPPLIER_PENDING_APPROVAL') {
              console.log('⏳ Pending approval intercepted:', error.response.data);
              setStatusType('pending');
              setStatusData(error.response.data.data);
              setShowStatusDialog(true);
            }
          }
          return Promise.reject(error);
        }
      );

      return () => {
        api.interceptors.response.eject(interceptor);
      };
    };

    if (user?.role === 'supplier') {
      const cleanup = setupInterceptor();
      return cleanup;
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setShowStatusDialog(false);
    window.location.href = '/login';
  };

  const handleClose = () => {
    setShowStatusDialog(false);
  };

  return {
    showStatusDialog,
    statusData,
    statusType,
    handleLogout,
    handleClose
  };
};