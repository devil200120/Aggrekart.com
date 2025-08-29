import { useState, useEffect, useCallback } from 'react';
import distancePricingService from '../services/distancePricingService';

export const useDistancePricing = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [deliveryZones, setDeliveryZones] = useState(null);

  // Get user's current location
  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const location = await distancePricingService.getCurrentLocation();
      setUserLocation(location);
      return location;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate distance and pricing
  const calculateDistance = useCallback(async (supplierLocation, customerLocation, totalWeight) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await distancePricingService.calculateDistance(
        supplierLocation,
        customerLocation,
        totalWeight
      );
      
      console.log('Hook received result:', result);
      
      // FIX: The service already returns response.data
      // Don't try to access result.data again
      if (result && result.data) {
        console.log('Returning result.data:', result.data);
        return result.data;
      } else if (result && result.distance) {
        console.log('Returning result directly:', result);
        return result;
      } else {
        console.error('Invalid result structure:', result);
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('Hook error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Find optimal suppliers
  const findOptimalSuppliers = useCallback(async (customerLocation, productIds, quantities) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await distancePricingService.findOptimalSuppliers(
        customerLocation,
        productIds,
        quantities
      );
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate cart delivery costs
  const calculateCartDelivery = useCallback(async (cartItems, customerLocation) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await distancePricingService.calculateCartDelivery(
        cartItems,
        customerLocation
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load delivery zones
  useEffect(() => {
    const loadDeliveryZones = async () => {
      try {
        const zones = await distancePricingService.getDeliveryZones();
        setDeliveryZones(zones.data.zones);
      } catch (err) {
        console.warn('Failed to load delivery zones:', err.message);
      }
    };

    loadDeliveryZones();
  }, []);

  return {
    loading,
    error,
    userLocation,
    deliveryZones,
    getCurrentLocation,
    calculateDistance,
    findOptimalSuppliers,
    calculateCartDelivery,
    clearError: () => setError(null)
  };
};

export default useDistancePricing;