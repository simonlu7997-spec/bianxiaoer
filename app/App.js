import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/i18n';
import { UserLocationProvider } from './src/context/UserLocationContext';
import RootNavigation, { linking } from './src/navigations/RootNavigation';
import { loadRemoteConfig } from './src/services/MapService';

// 启动时拉取后台在线配置（高德 Key / mock 开关 / 城市），失败则用本地配置
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await loadRemoteConfig();
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <UserLocationProvider>
          <NavigationContainer linking={linking}>
            <RootNavigation />
            <StatusBar style="light" />
          </NavigationContainer>
        </UserLocationProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
