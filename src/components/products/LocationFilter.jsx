import React, { useState, useEffect } from 'react'
import { MapPin, Target, AlertCircle, Check } from 'lucide-react'
import useGoogleMapsLocation from '../../hooks/useGoogleMapsLocation'
import './LocationFilter.css'

const LocationFilter = ({ onLocationChange, currentLocation, isEnabled = false }) => {
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState(null)
  const [maxDistance, setMaxDistance] = useState(10) // km
  const [locationEnabled, setLocationEnabled] = useState(isEnabled)
  
  const {
    getCurrentLocation,
    isLocationAvailable,
    isGoogleMapsLoaded,
    locationError
  } = useGoogleMapsLocation()

  const handleLocationDetection = async () => {
    setIsDetecting(true)
    setError(null)
    
    try {
      const location = await getCurrentLocation()
      console.log('📍 Location detected:', location)
      
      // Call parent callback with location and distance
      onLocationChange({
        latitude: location.lat,
        longitude: location.lng,
        maxDistance: maxDistance,
        enabled: true
      })
      
      setLocationEnabled(true)
    } catch (err) {
      console.error('❌ Location detection error:', err)
      setError(err.message)
    } finally {
      setIsDetecting(false)
    }
  }

  const handleDistanceChange = (newDistance) => {
    setMaxDistance(newDistance)
    
    if (locationEnabled && currentLocation) {
      onLocationChange({
        ...currentLocation,
        maxDistance: newDistance,
        enabled: true
      })
    }
  }

  const handleToggleLocation = () => {
    if (locationEnabled) {
      // Disable location filtering
      setLocationEnabled(false)
      onLocationChange({
        enabled: false
      })
    } else if (currentLocation) {
      // Re-enable with existing location
      setLocationEnabled(true)
      onLocationChange({
        ...currentLocation,
        maxDistance: maxDistance,
        enabled: true
      })
    } else {
      // Detect new location
      handleLocationDetection()
    }
  }

  const distanceOptions = [
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 20, label: '20 km' },
    { value: 50, label: '50 km' }
  ]

  return (
    <div className="location-filter">
      <div className="location-filter-header">
        <div className="location-toggle">
          <input
            type="checkbox"
            id="location-toggle"
            checked={locationEnabled}
            onChange={handleToggleLocation}
            disabled={isDetecting}
          />
          <label htmlFor="location-toggle" className="toggle-label">
            <MapPin size={16} />
            Show Nearby Suppliers
          </label>
        </div>
      </div>

      {locationEnabled && (
        <div className="location-filter-content">
          {/* Location Status */}
          <div className="location-status">
            {currentLocation ? (
              <div className="location-detected">
                <Check size={14} className="success-icon" />
                <span>Location detected</span>
              </div>
            ) : (
              <button 
                className="detect-location-btn"
                onClick={handleLocationDetection}
                disabled={isDetecting || !isLocationAvailable}
              >
                <Target size={14} />
                {isDetecting ? 'Detecting...' : 'Detect Location'}
              </button>
            )}
          </div>

          {/* Distance Range */}
          {currentLocation && (
            <div className="distance-selector">
              <label className="distance-label">
                Show suppliers within:
              </label>
              <div className="distance-options">
                {distanceOptions.map(option => (
                  <button
                    key={option.value}
                    className={`distance-option ${maxDistance === option.value ? 'active' : ''}`}
                    onClick={() => handleDistanceChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {(error || locationError) && (
            <div className="location-error">
              <AlertCircle size={14} />
              <span>{error || locationError}</span>
            </div>
          )}

          {/* Help Text */}
          {!isLocationAvailable && (
            <div className="location-help">
              <AlertCircle size={14} />
              <span>Location services not available in your browser</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LocationFilter