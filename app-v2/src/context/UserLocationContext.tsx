import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import * as Location from "expo-location";
import config from "@/src/config";

interface UserLocationValue {
  location: { latitude: number; longitude: number } | null;
  error: string | null;
  loading: boolean;
}

const UserLocationContext = createContext<UserLocationValue>({
  location: null,
  error: null,
  loading: false,
});

export function UserLocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("location_permission_denied");
          setLoading(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo(() => ({ location, error, loading }), [location, error, loading]);

  return <UserLocationContext.Provider value={value}>{children}</UserLocationContext.Provider>;
}

export const useUserLocation = () => useContext(UserLocationContext);

// 没有定位权限/失败时，退回默认中心点（霍尔果斯）
export const effectiveCenter = (location: { latitude: number; longitude: number } | null) =>
  location || config.DEFAULT_CENTER;

export default UserLocationContext;
