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

  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const GOOGLE_MAPS_API_KEY = 'AIzaSyAyheQD-Zju12VM0PebreDAyMol1AwQESQ';

  // Load Google Maps API
  useEffect(() => {
    if (window.google) {
      initializeAutocomplete();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeAutocomplete();
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize Google Places Autocomplete
  const initializeAutocomplete = () => {
    if (!window.google || !inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'IN' }, // Restrict to India
        fields: ['formatted_address', 'address_components', 'geometry', 'place_id'],
        types: ['address']
      }
    );

    autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
  };

  // Handle place selection from autocomplete
  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    
    if (!place.geometry) {
      console.log('No details available for input: ' + place.name);
      return;
    }

    const location = place.geometry.location;
    const addressData = extractAddressComponents(place);
    
    setAddress(place.formatted_address);

    // Callback with address data
    if (onAddressSelect) {
      onAddressSelect({
        formattedAddress: place.formatted_address,
        ...addressData,
        coordinates: {
          lat: location.lat(),
          lng: location.lng()
        },
        placeId: place.place_id
      });
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

  return (
    <div className={`google-maps-address-input ${className}`}>
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={address}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        className="address-input"
        autoComplete="off"
      />
    </div>
  );
};

export default GoogleMapsAddressInput;