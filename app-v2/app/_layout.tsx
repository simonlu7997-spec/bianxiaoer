import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import "../global.css";

import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider as LibThemeProvider } from "@/lib/theme-provider";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { I18nProvider } from "@/lib/i18n";
import { CartProvider } from "@/lib/cart-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, trpc } from "@/lib/trpc";
import { ensureRemoteConfig } from "@/src/services/MapService";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function RootNavigator() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
    // 启动时拉取后台在线配置（高德 Key / mock 开关 / 城市），失败自动回退本地配置
    void ensureRemoteConfig();
  }, []);

  return (
    <SafeAreaProvider>
    <CartProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="login" options={{ headerShown: false, presentation: "modal" }} />
                <Stack.Screen name="search" options={{ headerShown: false }} />
                <Stack.Screen name="map" options={{ headerShown: false }} />
                <Stack.Screen name="merchant/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="deal/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="admin" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="light" />
      </ThemeProvider>
    </CartProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <I18nProvider>
          <LibThemeProvider>
            <RootNavigator />
          </LibThemeProvider>
        </I18nProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
