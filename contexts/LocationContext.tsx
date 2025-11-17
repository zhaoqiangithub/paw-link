import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert } from 'react-native';

interface LocationInfo {
  longitude: number;
  latitude: number;
  address?: string;
  accuracy?: number;
}

interface LocationContextType {
  selectedLocation: LocationInfo | null;
  setSelectedLocation: (location: LocationInfo | null) => void;
  clearLocation: () => void;
  selectLocation: (location: LocationInfo) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider');
  }
  return context;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLocation, setSelectedLocationState] = useState<LocationInfo | null>(null);

  const setSelectedLocation = useCallback((location: LocationInfo | null) => {
    setSelectedLocationState(location);
  }, []);

  const clearLocation = useCallback(() => {
    setSelectedLocationState(null);
  }, []);

  const selectLocation = useCallback((location: LocationInfo) => {
    if (!location || !location.longitude || !location.latitude) {
      Alert.alert('提示', '位置信息不完整');
      return;
    }
    setSelectedLocationState(location);
  }, []);

  const value = {
    selectedLocation,
    setSelectedLocation,
    clearLocation,
    selectLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export default LocationContext;
