import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import config from '../config';

const UserLocationContext = createContext({ location: null, error: null, loading: false });

export function UserLocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('location_permission_denied');
          setLoading(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <UserLocationContext.Provider value={{ location, error, loading }}>
      {children}
    </UserLocationContext.Provider>
  );
}

export const useUserLocation = () => useContext(UserLocationContext);

// 没有定位权限/失败时，退回默认中心点（霍尔果斯）
export const effectiveCenter = (location) => location || config.DEFAULT_CENTER;

export default UserLocationContext;
