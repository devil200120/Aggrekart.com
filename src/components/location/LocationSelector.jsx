import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import './LocationSelector.css'

const LocationSelector = ({ onLocationChange, selectedLocation, showServiceAreas = true }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [cities, setCities] = useState([])

  // Free API endpoints
  const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
  const GEONAMES_BASE = 'https://api.geonames.org'
  const GEONAMES_USERNAME = 'aggrekart' // Free account (you need to register)

  // Fetch Indian cities using GeoNames API (Free)
  const fetchIndianCities = async () => {
    try {
      const response = await fetch(
        `${GEONAMES_BASE}/searchJSON?country=IN&featureClass=P&featureCode=PPLA&featureCode=PPLA2&featureCode=PPLC&maxRows=100&username=${GEONAMES_USERNAME}`
      )
      const data = await response.json()
      
      return data.geonames?.map(city => ({
        id: city.geonameId,
        name: city.name,
        state: city.adminName1,
        country: city.countryName,
        population: city.population,
        lat: city.lat,
        lng: city.lng,
        available: city.population > 100000 // Only cities with 100k+ population
      })) || []
    } catch (error) {
      console.error('Error fetching cities:', error)
      return []
    }
  }

  // React Query for cities
  const { data: citiesData, isLoading: citiesLoading } = useQuery(
    'indianCities',
    fetchIndianCities,
    {
      staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
      cacheTime: 24 * 60 * 60 * 1000,
      onSuccess: (data) => {
        setCities(data)
      }
    }
  )

  // Filter cities based on search
  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 20) // Limit to 20 results

  // Reverse geocoding using Nominatim (Free)
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `${NOMINATIM_BASE}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=en`
      )
      const data = await response.json()
      
      return {
        city: data.address?.city || data.address?.town || data.address?.village || data.address?.suburb,
        state: data.address?.state,
        country: data.address?.country,
        pincode: data.address?.postcode,
        address: data.display_name,
        coordinates: { latitude, longitude }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      throw new Error('Failed to detect location')
    }
  }

  // Get service areas using Overpass API (Free OpenStreetMap data)
  const fetchServiceAreas = async (cityName, state) => {
    try {
      // Using Overpass API to get neighborhoods/areas within a city
      const overpassQuery = `
        [out:json][timeout:25];
        (
          relation["admin_level"="8"]["name"~"${cityName}"]["addr:state"~"${state}"];
          relation["admin_level"="9"]["name"~"${cityName}"];
          relation["admin_level"="10"]["name"~"${cityName}"];
        );
        out geom;
      `
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
      })
      
      const data = await response.json()
      
      return data.elements?.map(area => ({
        id: area.id,
        name: area.tags?.name || 'Unknown Area',
        type: area.tags?.['admin_level'] || 'area',
        deliveryTime: '2-4 hours', // Default
        deliveryCharge: 50 // Default ₹50
      })).slice(0, 10) || []
    } catch (error) {
      console.error('Error fetching service areas:', error)
      return []
    }
  }

  // Service areas query
  const { data: serviceAreasData, isLoading: areasLoading } = useQuery(
    ['serviceAreas', selectedLocation?.name, selectedLocation?.state],
    () => fetchServiceAreas(selectedLocation.name, selectedLocation.state),
    {
      enabled: !!selectedLocation?.name && showServiceAreas,
      staleTime: 60 * 60 * 1000, // Cache for 1 hour
    }
  )

  const serviceAreas = serviceAreasData || []

  const detectLocation = () => {
    setGettingLocation(true)
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser')
      setGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          
          // Use Nominatim for reverse geocoding
          const locationData = await reverseGeocode(latitude, longitude)
          setCurrentLocation(locationData)
          
          // Find matching city in our fetched cities
          const matchingCity = cities.find(city => 
            city.name.toLowerCase() === locationData.city?.toLowerCase() ||
            city.name.toLowerCase().includes(locationData.city?.toLowerCase())
          )
          
          if (matchingCity && matchingCity.available) {
            onLocationChange({
              id: matchingCity.id,
              name: matchingCity.name,
              state: matchingCity.state,
              coordinates: { latitude, longitude },
              detected: true
            })
            setIsOpen(false)
          } else {
            alert(`We detected ${locationData.city}, ${locationData.state}. We're expanding to your area soon!`)
          }
        } catch (error) {
          alert('Failed to detect location. Please select manually.')
        } finally {
          setGettingLocation(false)
        }
      },
      (error) => {
        let message = 'Unable to retrieve your location. '
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message += 'Location access was denied.'
            break
          case error.POSITION_UNAVAILABLE:
            message += 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            message += 'Location request timed out.'
            break
          default:
            message += 'An unknown error occurred.'
            break
        }
        alert(message + ' Please select manually.')
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const handleCitySelect = (city) => {
    onLocationChange({
      id: city.id,
      name: city.name,
      state: city.state,
      population: city.population,
      coordinates: { latitude: parseFloat(city.lat), longitude: parseFloat(city.lng) },
      available: city.available
    })
    setSearchTerm('')
    if (!showServiceAreas) {
      setIsOpen(false)
    }
  }

  const handleAreaSelect = (area) => {
    onLocationChange({
      ...selectedLocation,
      areaId: area.id,
      areaName: area.name,
      deliveryTime: area.deliveryTime,
      deliveryCharge: area.deliveryCharge
    })
    setIsOpen(false)
  }

  // Search cities using Nominatim when user types
  const searchCities = async (query) => {
    if (query.length < 3) return []
    
    try {
      const response = await fetch(
        `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query + ', India')}&format=json&addressdetails=1&limit=10&featuretype=city`
      )
      const data = await response.json()
      
      return data.map(item => ({
        id: item.place_id,
        name: item.address?.city || item.address?.town || item.name,
        state: item.address?.state,
        lat: item.lat,
        lng: item.lon,
        available: true // Assume all searched cities are available
      })).filter(city => city.name && city.state)
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  }

  // Debounced search effect
  useEffect(() => {
    if (searchTerm.length >= 3) {
      const timeoutId = setTimeout(() => {
        searchCities(searchTerm).then(results => {
          if (results.length > 0) {
            setCities(prev => [...results, ...prev.filter(city => 
              !results.some(result => result.name === city.name)
            )])
          }
        })
      }, 500)
      
      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm])

  return (
    <div className="location-selector">
      <div className="location-trigger" onClick={() => setIsOpen(true)}>
        <div className="location-icon">📍</div>
        <div className="location-info">
          {selectedLocation ? (
            <>
              <span className="location-text">
                {selectedLocation.areaName ? 
                  `${selectedLocation.areaName}, ${selectedLocation.name}` : 
                  selectedLocation.name
                }
              </span>
              <span className="location-state">{selectedLocation.state}</span>
            </>
          ) : (
            <>
              <span className="location-text">Select delivery location</span>
              <span className="location-state">Choose your city</span>
            </>
          )}
        </div>
        <div className="location-arrow">▼</div>
      </div>

      {isOpen && (
        <div className="location-modal">
          <div className="modal-overlay" onClick={() => setIsOpen(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Select Delivery Location</h3>
              <button 
                className="modal-close"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Auto-detect location */}
              <button 
                className="detect-location-btn"
                onClick={detectLocation}
                disabled={gettingLocation}
              >
                <span className="detect-icon">🎯</span>
                {gettingLocation ? 'Detecting location...' : 'Use current location'}
              </button>

              {/* Search cities */}
              <div className="search-section">
                <h4>Search for your city</h4>
                <input
                  type="text"
                  placeholder="Type city name (min 3 characters)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="city-search"
                />
                {searchTerm.length > 0 && searchTerm.length < 3 && (
                  <small className="search-hint">Type at least 3 characters to search</small>
                )}
              </div>

              {/* Cities list */}
              <div className="cities-section">
                {citiesLoading ? (
                  <div className="loading">Loading cities from GeoNames...</div>
                ) : (
                  <div className="cities-list">
                    {filteredCities.map((city) => (
                      <button
                        key={city.id}
                        className={`city-item ${selectedLocation?.id === city.id ? 'selected' : ''} ${!city.available ? 'unavailable' : ''}`}
                        onClick={() => city.available && handleCitySelect(city)}
                        disabled={!city.available}
                      >
                        <div className="city-info">
                          <span className="city-name">{city.name}</span>
                          <span className="city-state">{city.state}</span>
                        </div>
                        <div className="city-meta">
                          {city.available ? (
                            <>
                              <span className="delivery-info">✅ Available</span>
                              <span className="population">
                                {city.population ? `${(city.population / 100000).toFixed(1)}L people` : ''}
                              </span>
                            </>
                          ) : (
                            <span className="coming-soon">🚧 Coming Soon</span>
                          )}
                        </div>
                      </button>
                    ))}
                    {filteredCities.length === 0 && !citiesLoading && (
                      <div className="no-cities">
                        {searchTerm ? 'No cities found. Try different spelling.' : 'Loading cities...'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Service areas if city selected */}
              {showServiceAreas && selectedLocation?.name && (
                <div className="areas-section">
                  <h4>Areas in {selectedLocation.name}</h4>
                  {areasLoading ? (
                    <div className="loading">Loading areas from OpenStreetMap...</div>
                  ) : serviceAreas.length > 0 ? (
                    <div className="areas-list">
                      {serviceAreas.map((area) => (
                        <button
                          key={area.id}
                          className={`area-item ${selectedLocation?.areaId === area.id ? 'selected' : ''}`}
                          onClick={() => handleAreaSelect(area)}
                        >
                          <div className="area-info">
                            <span className="area-name">{area.name}</span>
                            <span className="area-type">Type: {area.type}</span>
                          </div>
                          <div className="area-meta">
                            <span className="delivery-time">
                              🚚 {area.deliveryTime}
                            </span>
                            <span className="delivery-charge">
                              ₹{area.deliveryCharge} delivery
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="no-areas">
                      <p>We deliver throughout {selectedLocation.name}!</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setIsOpen(false)}
                      >
                        Continue with {selectedLocation.name}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationSelector