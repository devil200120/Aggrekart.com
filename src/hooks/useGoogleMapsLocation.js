import { useState, useEffect, useCallback } from 'react';

const useGoogleMapsLocation = () => {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationAvailable, setIsLocationAvailable] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  // Check if Google Maps is already loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleMapsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) {
      return;
    }

    // Load Google Maps script if not already loaded
    const loadGoogleMaps = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Wait for it to load
        const checkInterval = setInterval(() => {
          if (checkGoogleMaps()) {
            clearInterval(checkInterval);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Google Maps API key not found in environment variables');
        setLocationError('Google Maps API key not configured');
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;

      // Global callback function
      window.initGoogleMapsCallback = () => {
        console.log('Google Maps API loaded successfully');
        setIsGoogleMapsLoaded(true);
      };

      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        setLocationError('Failed to load Google Maps');
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Check if geolocation is available
  useEffect(() => {
    setIsLocationAvailable('geolocation' in navigator);
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!isLocationAvailable) {
        const error = new Error('Geolocation is not supported by this browser');
        setLocationError(error.message);
        reject(error);
        return;
      }

      setIsDetecting(true);
      setLocationError(null);

      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          console.log('Location detected:', location);
          setCurrentLocation(location);
          setIsDetecting(false);
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = `Location error: ${error.message}`;
              break;
          }
          
          console.error('Geolocation error:', error);
          setLocationError(errorMessage);
          setIsDetecting(false);
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }, [isLocationAvailable]);

  // Watch position (for real-time tracking)
  const watchPosition = useCallback((callback) => {
    if (!isLocationAvailable) {
      return null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 minute
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        setCurrentLocation(location);
        if (callback) callback(location);
      },
      (error) => {
        console.error('Position watch error:', error);
        setLocationError(error.message);
      },
      options
    );
  }, [isLocationAvailable]);

  // Calculate distance between two points
  const calculateDistance = useCallback((point1, point2) => {
    if (!isGoogleMapsLoaded || !window.google) {
      console.error('Google Maps not loaded for distance calculation');
      return Promise.reject(new Error('Google Maps not loaded'));
    }

    const service = new window.google.maps.DistanceMatrixService();
    
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix({
        origins: [new window.google.maps.LatLng(point1.lat, point1.lng)],
        destinations: [new window.google.maps.LatLng(point2.lat, point2.lng)],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === 'OK') {
          const result = response.rows[0].elements[0];
          if (result.status === 'OK') {
            resolve({
              distance: result.distance,
              duration: result.duration,
              distanceValue: result.distance.value,
              durationValue: result.duration.value
            });
          } else {
            reject(new Error(`Distance calculation failed: ${result.status}`));
          }
        } else {
          reject(new Error(`Distance Matrix API error: ${status}`));
        }
      });
    });
  }, [isGoogleMapsLoaded]);

  // Reverse geocoding - Fixed implementation
  const reverseGeocode = useCallback((lat, lng) => {
    if (!isGoogleMapsLoaded || !window.google) {
      console.error('Google Maps not loaded for reverse geocoding');
      return Promise.reject(new Error('Google Maps not loaded'));
    }

    // Validate coordinates
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates for reverse geocoding:', { lat, lng });
      return Promise.reject(new Error('Invalid coordinates'));
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('Coordinates out of range:', { lat, lng });
      return Promise.reject(new Error('Coordinates out of valid range'));
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ 
        location: { lat: Number(lat), lng: Number(lng) } 
      }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          console.log('Reverse geocoding successful:', results[0]);
          resolve(results[0]);
        } else {
          const errorMsg = `Reverse geocoding failed: ${status}`;
          console.error(errorMsg, { lat, lng, results });
          reject(new Error(errorMsg));
        }
      });
    });
  }, [isGoogleMapsLoaded]);

  // Create map instance
  const createMap = useCallback((container, options = {}) => {
    if (!isGoogleMapsLoaded || !window.google || !container) {
      console.error('Cannot create map: Google Maps not loaded or container not provided');
      return null;
    }

    const defaultOptions = {
      center: { lat: 28.6139, lng: 77.209 }, // Delhi
      zoom: 15,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      ...options
    };

    try {
      const map = new window.google.maps.Map(container, defaultOptions);
      setMapInstance(map);
      console.log('Map created successfully');
      return map;
    } catch (error) {
      console.error('Error creating map:', error);
      return null;
    }
  }, [isGoogleMapsLoaded]);

  // Create autocomplete
  const createAutocomplete = useCallback((input, options = {}) => {
    if (!isGoogleMapsLoaded || !window.google || !input) {
      console.error('Cannot create autocomplete: Google Maps not loaded or input not provided');
      return null;
    }

    const defaultOptions = {
      types: ['address'],
      componentRestrictions: { country: 'IN' },
      ...options
    };

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(input, defaultOptions);
      console.log('Autocomplete created successfully');
      return autocomplete;
    } catch (error) {
      console.error('Error creating autocomplete:', error);
      return null;
    }
  }, [isGoogleMapsLoaded]);

  return {
    isGoogleMapsLoaded,
    currentLocation,
    isLocationAvailable,
    locationError,
    isDetecting,
    mapInstance,
    getCurrentLocation,
    watchPosition,
    calculateDistance,
    reverseGeocode,
    createMap,
    createAutocomplete
  };
};

export default useGoogleMapsLocation;