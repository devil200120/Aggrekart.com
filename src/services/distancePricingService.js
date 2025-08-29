import api from './api';

class DistancePricingService {
  // Calculate distance and transport cost
  async calculateDistance(supplierLocation, customerLocation, totalWeight = 1) {
    try {
      const response = await api.post('/distance-pricing/calculate', {
        supplierLocation,
        customerLocation,
        totalWeight
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to calculate distance');
    }
  }

  // Find optimal suppliers based on location
  async findOptimalSuppliers(customerLocation, productIds, quantities) {
    try {
      const response = await api.post('/distance-pricing/optimal-suppliers', {
        customerLocation,
        productIds,
        quantities
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to find optimal suppliers');
    }
  }

  // Get delivery zones information
  async getDeliveryZones() {
    try {
      const response = await api.get('/distance-pricing/delivery-zones');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get delivery zones');
    }
  }

  // Estimate delivery time
  async estimateDelivery(distance, zone = 'urban') {
    try {
      const response = await api.post('/distance-pricing/estimate-delivery', {
        distance,
        zone
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to estimate delivery time');
    }
  }

  // Get user's current location
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let message = 'Location access denied';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timeout';
              break;
          }
          reject(new Error(message));
        },
        options
      );
    });
  }

  // Calculate delivery cost for products in cart
  async calculateCartDelivery(cartItems, customerLocation) {
    try {
      // Group items by supplier
      const supplierGroups = {};
      const productIds = [];
      const quantities = [];

      cartItems.forEach(item => {
        const supplierId = item.product.supplier._id || item.product.supplier;
        
        if (!supplierGroups[supplierId]) {
          supplierGroups[supplierId] = {
            supplier: item.product.supplier,
            items: []
          };
        }
        
        supplierGroups[supplierId].items.push(item);
        productIds.push(item.product._id);
        quantities.push(item.quantity);
      });

      const result = await this.findOptimalSuppliers(
        customerLocation,
        productIds,
        quantities
      );

      return {
        suppliers: result.data.suppliers,
        consolidation: result.data.consolidation,
        recommendation: result.data.recommendation
      };
    } catch (error) {
      throw new Error('Failed to calculate cart delivery costs');
    }
  }
}

export default new DistancePricingService();