import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

import { BannerCarousel } from "@/components/home/BannerCarousel";
import { HomeHeader } from "@/components/home/HomeHeader";
import { MerchantHorizontalList, type Merchant } from "@/components/home/MerchantCard";
import { ServiceGrid } from "@/components/home/ServiceGrid";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import type { MerchantSummary } from "@/shared/bianxiaoer";

// Banner 图片打包进 App 本地资源（CloudFront 在中国大陆网络不可达，改为本地加载保证离线/弱网可用）
import banner1 from "@/assets/banners/banner1.jpg";
import banner2 from "@/assets/banners/banner2.jpg";
import banner3 from "@/assets/banners/banner3.jpg";

const BANNER_IMAGES = [banner1, banner2, banner3];

function toMerchantCard(merchant: MerchantSummary, language: "zh" | "ru" | "en"): Merchant {
  return {
    id: String(merchant.id),
    name: merchant.name[language],
    category: merchant.category,
    imageUrl: merchant.coverImageUrl,
    rating: merchant.rating,
    reviewCount: merchant.reviewCount,
    distance: merchant.distanceKm === null ? "—" : merchant.distanceKm.toFixed(1),
    isOpen: merchant.isOpen,
    tags: merchant.tags,
  };
}

export default function HomeScreen() {
  const colors = useColors();
  const { language, t } = useI18n();
  const scrollViewRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const homeQuery = trpc.catalog.home.useQuery({ locale: language, location });

  const requestLocation = useCallback(async () => {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return;
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") return;
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
  }, []);

  const banners = useMemo(
    () => t.banners.map((banner, index) => ({
      id: String(index + 1),
      image: BANNER_IMAGES[index] ?? BANNER_IMAGES[0],
      title: banner.title,
      subtitle: banner.subtitle,
      onPress: () => router.push("/(tabs)/deals"),
    })),
    [t.banners],
  );

  const featuredMerchants = useMemo(
    () => (homeQuery.data?.featuredMerchants ?? []).map((merchant) => toMerchantCard(merchant, language)),
    [homeQuery.data?.featuredMerchants, language],
  );
  const nearbyMerchants = useMemo(
    () => (homeQuery.data?.nearbyMerchants ?? []).map((merchant) => toMerchantCard(merchant, language)),
    [homeQuery.data?.nearbyMerchants, language],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await homeQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <HomeHeader
        city={homeQuery.data?.city[language] ?? t.locating}
        onLocationPress={() => { void requestLocation(); }}
        onSearchPress={() => router.push("/search")}
        onSearchSubmit={(text) => router.push({ pathname: "/search", params: { q: text } })}
      />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || homeQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <BannerCarousel banners={banners} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <ServiceGrid />
        </View>
        <View style={styles.sectionDivider} />
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <MerchantHorizontalList
            merchants={featuredMerchants}
            title={t.hotRecommend}
            loading={homeQuery.isLoading}
            onSeeAll={() => router.push("/search")}
          />
        </View>
        <View style={styles.sectionDivider} />
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <MerchantHorizontalList
            merchants={nearbyMerchants}
            title={t.nearbyMerchants}
            loading={homeQuery.isLoading}
            onSeeAll={() => router.push("/search")}
          />
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollView: { flex: 1 },
  card: { overflow: "hidden" },
  sectionDivider: { height: 8, backgroundColor: "#F4F7FB" },
  sectionCard: { paddingVertical: 16 },
  bottomSpacing: { height: 24 },
});
