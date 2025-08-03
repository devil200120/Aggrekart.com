import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supplierAPI } from '../services/api';

export const useSupplierSuspensionCheck = () => {
  const { user, logout } = useAuth();
  const [suspensionData, setSuspensionData] = useState(null);
  const [showSuspensionDialog, setShowSuspensionDialog] = useState(false);

  // CHECK SUSPENSION ON EVERY PAGE LOAD/USER CHANGE
  useEffect(() => {
    const checkSupplierStatus = async () => {
      if (user?.role === 'supplier') {
        try {
          // This will trigger the middleware check immediately
          await supplierAPI.getProfile();
        } catch (error) {
          if (error.response?.status === 403 && error.response?.data?.error === 'SUPPLIER_SUSPENDED') {
            console.log('🚫 Supplier suspended detected:', error.response.data);
            setSuspensionData(error.response.data.data);
            setShowSuspensionDialog(true);
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
      const { default: api } = require('../services/api');
      
      const interceptor = api.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 403 && error.response?.data?.error === 'SUPPLIER_SUSPENDED') {
            console.log('🚫 Suspension intercepted:', error.response.data);
            setSuspensionData(error.response.data.data);
            setShowSuspensionDialog(true);
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
    setShowSuspensionDialog(false);
    window.location.href = '/login';
  };

  const handleClose = () => {
    setShowSuspensionDialog(false);
  };

  return {
    showSuspensionDialog,
    suspensionData,
    handleLogout,
    handleClose
  };
};