import { useState, useEffect, useCallback, useRef } from 'react'
import useGoogleMapsLocation from './useGoogleMapsLocation'

const useDynamicDistance = (suppliers = [], autoUpdate = true) => {
  const [distances, setDistances] = useState(new Map())
  const [isCalculating, setIsCalculating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error, setError] = useState(null)
  
  const intervalRef = useRef(null)
  const {
    currentLocation,
    isGoogleMapsLoaded,
    calculateDistance,
    calculateDeliveryTime,
    isLocationAvailable
  } = useGoogleMapsLocation()

  // Extract supplier locations
  const supplierLocations = suppliers
    .filter(supplier => supplier?.location?.coordinates)
    .map(supplier => ({
      supplierId: supplier._id,
      supplierName: supplier.businessName || supplier.companyName || supplier.name,
      latitude: supplier.location.coordinates.latitude || supplier.location.coordinates[1],
      longitude: supplier.location.coordinates.longitude || supplier.location.coordinates[0],
      city: supplier.location.city,
      state: supplier.location.state
    }))

  // Calculate distances for all suppliers
  const calculateDistances = useCallback(async (includeTraffic = true) => {
    if (!isLocationAvailable || !isGoogleMapsLoaded || supplierLocations.length === 0) {
      return
    }

    setIsCalculating(true)
    setError(null)

    try {
      // Batch process in groups of 10 to avoid API limits
      const batchSize = 10
      const batches = []
      
      for (let i = 0; i < supplierLocations.length; i += batchSize) {
        batches.push(supplierLocations.slice(i, i + batchSize))
      }

      const allResults = []
      
      for (const batch of batches) {
        try {
          const batchResults = await calculateDistance(batch, includeTraffic)
          allResults.push(...batchResults)
          
          // Small delay between batches to respect API limits
          if (batches.indexOf(batch) < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        } catch (batchError) {
          console.warn('Batch calculation failed:', batchError)
          // Add fallback entries for failed batch
          batch.forEach(location => {
            allResults.push({
              destination: location,
              error: 'Calculation failed',
              fallbackDistance: calculateFallbackDistance(location)
            })
          })
        }
      }

      // Process results into Map
      const newDistances = new Map()
      
      allResults.forEach(result => {
        if (result.error) {
          const fallback = result.fallbackDistance || calculateFallbackDistance(result.destination)
          newDistances.set(result.destination.supplierId, {
            supplierId: result.destination.supplierId,
            supplierName: result.destination.supplierName,
            error: result.error,
            fallbackDistance: fallback,
            calculatedAt: new Date().toISOString(),
            isFallback: true
          })
        } else {
          const deliveryInfo = calculateDeliveryTime(
            result.duration.value,
            result.durationInTraffic?.value
          )

          newDistances.set(result.destination.supplierId, {
            supplierId: result.destination.supplierId,
            supplierName: result.destination.supplierName,
            distance: {
              text: result.distance.text,
              meters: result.distance.value,
              kilometers: Math.round(result.distance.value / 1000 * 10) / 10
            },
            duration: {
              text: result.duration.text,
              seconds: result.duration.value,
              minutes: Math.round(result.duration.value / 60)
            },
            durationInTraffic: result.durationInTraffic ? {
              text: result.durationInTraffic.text,
              seconds: result.durationInTraffic.value,
              minutes: Math.round(result.durationInTraffic.value / 60)
            } : null,
            deliveryTime: deliveryInfo,
            calculatedAt: new Date().toISOString(),
            hasTrafficData: !!result.durationInTraffic,
            isFallback: false
          })
        }
      })

      setDistances(newDistances)
      setLastUpdate(new Date())
      console.log(`✅ Distance calculated for ${newDistances.size} suppliers`)
      
    } catch (error) {
      console.error('Distance calculation error:', error)
      setError(error.message)
    } finally {
      setIsCalculating(false)
    }
  }, [isLocationAvailable, isGoogleMapsLoaded, supplierLocations, calculateDistance, calculateDeliveryTime])

  // Fallback distance calculation using Haversine formula
  const calculateFallbackDistance = useCallback((destination) => {
    if (!currentLocation.coordinates) return null

    const R = 6371 // Earth's radius in kilometers
    const dLat = toRad(destination.latitude - currentLocation.coordinates.latitude)
    const dLon = toRad(destination.longitude - currentLocation.coordinates.longitude)
    
    const lat1 = toRad(currentLocation.coordinates.latitude)
    const lat2 = toRad(destination.latitude)

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c

    const estimatedDuration = Math.round(distance * 60) // Assume 60 minutes per km in traffic
    const deliveryInfo = calculateDeliveryTime(estimatedDuration * 60)

    return {
      distance: {
        text: `${distance.toFixed(1)} km`,
        meters: Math.round(distance * 1000),
        kilometers: Math.round(distance * 10) / 10
      },
      duration: {
        text: `${Math.round(estimatedDuration)} min`,
        seconds: estimatedDuration * 60,
        minutes: estimatedDuration
      },
      deliveryTime: deliveryInfo,
      isFallback: true
    }
  }, [currentLocation?.coordinates, calculateDeliveryTime]) // Fixed: Added optional chaining

  const toRad = (deg) => deg * (Math.PI / 180)

  // Auto-update distances every 5 minutes
  useEffect(() => {
    if (autoUpdate && isLocationAvailable && isGoogleMapsLoaded && supplierLocations.length > 0) {
      // Initial calculation
      calculateDistances(true)
      
      // Set up interval for updates
      intervalRef.current = setInterval(() => {
        calculateDistances(true)
      }, 5 * 60 * 1000) // 5 minutes
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [autoUpdate, isLocationAvailable, isGoogleMapsLoaded, supplierLocations.length, calculateDistances])

  // Manual refresh
  const refreshDistances = useCallback(async (includeTraffic = true) => {
    await calculateDistances(includeTraffic)
  }, [calculateDistances])

  // Get distance for specific supplier
  const getSupplierDistance = useCallback((supplierId) => {
    return distances.get(supplierId) || null
  }, [distances])

  // Get sorted suppliers by distance
  const getSortedSuppliersByDistance = useCallback(() => {
    return Array.from(distances.values())
      .filter(item => !item.error)
      .sort((a, b) => {
        const distanceA = a.distance?.meters || a.fallbackDistance?.distance?.meters || Infinity
        const distanceB = b.distance?.meters || b.fallbackDistance?.distance?.meters || Infinity
        return distanceA - distanceB
      })
  }, [distances])

  // Get delivery stats
  const getDeliveryStats = useCallback(() => {
    const validDistances = Array.from(distances.values()).filter(item => 
      item.distance || item.fallbackDistance
    )
    
    if (validDistances.length === 0) return null

    const distances_km = validDistances.map(item => 
      item.distance?.kilometers || item.fallbackDistance?.distance?.kilometers || 0
    )
    
    return {
      total: validDistances.length,
      nearestDistance: Math.min(...distances_km),
      averageDistance: distances_km.reduce((a, b) => a + b, 0) / distances_km.length,
      sameDayAvailable: validDistances.filter(item => {
        const hours = item.deliveryTime?.hours || item.fallbackDistance?.deliveryTime?.hours || 24
        return hours <= 4
      }).length,
      nextDayAvailable: validDistances.filter(item => {
        const hours = item.deliveryTime?.hours || item.fallbackDistance?.deliveryTime?.hours || 48
        return hours <= 24
      }).length
    }
  }, [distances])

  return {
    distances: Array.from(distances.values()),
    distancesMap: distances,
    isCalculating,
    lastUpdate,
    error,
    isLocationAvailable: isLocationAvailable && isGoogleMapsLoaded,
    currentLocation,
    refreshDistances,
    getSupplierDistance,
    getSortedSuppliersByDistance,
    getDeliveryStats
  }
}

export default useDynamicDistance