// Replace lines 1-40 with this improved version:

import React, { useState, useEffect, useRef } from 'react';
import './GoogleMapsAddressInput.css';

const GoogleMapsAddressInput = ({ 
  onAddressSelect, 
  defaultValue = '', 
  placeholder = 'Enter your address',
  required = false,
  className = '',
  name = 'address'
}) => {
  const [address, setAddress] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Use environment variable or fallback to your key
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBVeker3NKNQyfAy-XkVDrqodDoU7GYQyk';

  // Load Google Maps API
  useEffect(() => {
    loadGoogleMapsAPI();
  }, []);

  const loadGoogleMapsAPI = () => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('✅ Google Maps API already loaded');
      initializeAutocomplete();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('🔄 Google Maps API script already exists, waiting for load...');
      existingScript.addEventListener('load', () => {
        initializeAutocomplete();
      });
      return;
    }

    console.log('🔄 Loading Google Maps API...');
    setIsLoading(true);
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    // Global callback for Google Maps
    window.initMap = () => {
      console.log('✅ Google Maps API loaded successfully');
      setIsLoading(false);
      setError(null);
      initializeAutocomplete();
    };

    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps API:', error);
      setIsLoading(false);
      setError('Failed to load Google Maps. Please check your API key and internet connection.');
    };

    document.head.appendChild(script);
  };

  // Initialize Google Places Autocomplete
  const initializeAutocomplete = () => {
    if (!window.google || !window.google.maps || !window.google.maps.places || !inputRef.current) {
      console.log('⚠️ Google Maps API not ready yet');
      return;
    }

    try {
      console.log('🔧 Initializing Google Places Autocomplete...');
      
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: 'IN' }, // Restrict to India
          fields: ['formatted_address', 'address_components', 'geometry', 'place_id'],
          types: ['address']
        }
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
      console.log('✅ Google Places Autocomplete initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize autocomplete:', error);
      setError('Failed to initialize address autocomplete');
    }
  };

  // Rest of your component stays the same...
  // Initialize Google Places Autocomplete
  

  // Handle place selection from autocomplete
  const handlePlaceSelect = () => {
  if (!autocompleteRef.current) return;

  try {
    const place = autocompleteRef.current.getPlace();
    
    if (!place.formatted_address) {
      console.log('⚠️ No address details for this place');
      return;
    }

    console.log('✅ Google Places data:', place);
    setAddress(place.formatted_address);
    
    if (onAddressSelect) {
      // Send the raw data to RegisterPage for processing
      onAddressSelect({
        address: place.formatted_address,
        coordinates: place.geometry?.location ? {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        } : null,
        placeId: place.place_id,
        addressComponents: place.address_components || []
      });
    }
  } catch (error) {
    console.error('❌ Error handling place selection:', error);
    setError('Error processing selected address');
  }
};
  // Extract address components
  const extractAddressComponents = (place) => {
    const components = place.address_components || [];
    const addressData = {
      streetNumber: '',
      route: '',
      locality: '',
      sublocality: '',
      city: '',
      state: '',
      pincode: '',
      country: ''
    };

    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        addressData.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        addressData.route = component.long_name;
      } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        addressData.sublocality = component.long_name;
      } else if (types.includes('locality')) {
        addressData.locality = component.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        addressData.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressData.state = component.long_name;
      } else if (types.includes('postal_code')) {
        addressData.pincode = component.long_name;
      } else if (types.includes('country')) {
        addressData.country = component.long_name;
      }
    });

    // Fallback for city if not found in administrative_area_level_2
    if (!addressData.city && addressData.locality) {
      addressData.city = addressData.locality;
    }

    return addressData;
  };

  // Handle manual input change
  const handleInputChange = (e) => {
    setAddress(e.target.value);
  };

  // Add this to your component's return statement:

return (
  <div className={`google-maps-address-input ${className} ${error ? 'error' : ''}`}>
    {error && (
      <div className="error-message" style={{
        color: '#dc2626',
        fontSize: '0.875rem',
        marginBottom: '0.5rem'
      }}>
        {error}
      </div>
    )}
    
    {isLoading && (
      <div className="loading-message" style={{
        color: '#6b7280',
        fontSize: '0.875rem',
        marginBottom: '0.5rem'
      }}>
        Loading Google Maps...
      </div>
    )}
    
    <input
      ref={inputRef}
      type="text"
      name={name}
      value={address}
      onChange={handleInputChange}
      placeholder={isLoading ? 'Loading...' : placeholder}
      required={required}
      className="address-input"
      autoComplete="off"
      disabled={isLoading || !!error}
    />
  </div>
);
};

export default GoogleMapsAddressInput;