import React, { createContext, useState, useContext, useEffect } from 'react';
import { locationAPI } from '@/utils/api';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationAPI.getAll();
      setLocations(response.data);
      
      // Auto-select first location if none selected
      if (!selectedLocation && response.data.length > 0) {
        const savedLocationId = localStorage.getItem('selectedLocationId');
        const location = savedLocationId 
          ? response.data.find(loc => loc.id === savedLocationId)
          : response.data[0];
        
        setSelectedLocation(location || response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (location) => {
    setSelectedLocation(location);
    localStorage.setItem('selectedLocationId', location.id);
  };

  const createLocation = async (locationData) => {
    try {
      const response = await locationAPI.create(locationData);
      setLocations([...locations, response.data]);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create location'
      };
    }
  };

  const updateLocation = async (locationId, locationData) => {
    try {
      const response = await locationAPI.update(locationId, locationData);
      setLocations(locations.map(loc => 
        loc.id === locationId ? response.data : loc
      ));
      if (selectedLocation?.id === locationId) {
        setSelectedLocation(response.data);
      }
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update location'
      };
    }
  };

  const deleteLocation = async (locationId) => {
    try {
      await locationAPI.delete(locationId);
      setLocations(locations.filter(loc => loc.id !== locationId));
      if (selectedLocation?.id === locationId) {
        setSelectedLocation(locations[0] || null);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete location'
      };
    }
  };

  return (
    <LocationContext.Provider value={{
      locations,
      selectedLocation,
      loading,
      selectLocation,
      createLocation,
      updateLocation,
      deleteLocation,
      refreshLocations: fetchLocations
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};
