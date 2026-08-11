import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/src/theme/colors";
import config from "@/src/config";
import { useLanguage } from "@/src/i18n";
import { useUserLocation } from "@/src/context/UserLocationContext";
import { fetchMerchants, searchByCategory, navLinks } from "@/src/services/MapService";
import MerchantMap, { type MapHandle } from "@/src/components/MerchantMap";
import categories from "@/src/data/categories";
import type { Merchant } from "@/src/data/merchants";

// 全屏地图探索页：城市切换 + 分类筛选 + 图钉信息卡 + 一键导航（v1 保留功能）
export default function MapScreen() {
  const { t, lang } = useLanguage();
  const { location } = useUserLocation();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; city?: string }>();
  const mapRef = useRef<MapHandle>(null);

  const initialCategory = params.category || "all";
  const initialCity = config.CITIES.find((c) => c.id === params.city) || config.CITIES[0];
  const [city, setCity] = useState(initialCity);
  const [category, setCategory] = useState(initialCategory);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Merchant | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // 基础商户（mock/后台）+ 真实 POI（高德，按分类关键词搜索）
      const [base, pois] = await Promise.all([
        fetchMerchants(category, city.name),
        searchByCategory(category, lang, city.name),
      ]);
      setMerchants([...base, ...pois]);
      setLoading(false);
      setSelected(null);
    })();
  }, [category, city.name, lang]);

  const filtered = useMemo(
    () => (category === "all" ? merchants : merchants.filter((m) => m.category === category)),
    [merchants, category]
  );

  const switchCity = (c: (typeof config.CITIES)[number]) => {
    setCity(c);
    mapRef.current?.animateToCenter(c.center);
  };

  const goBackToCenter = () => mapRef.current?.animateToCenter(location || city.center);

  const goDetail = (m: Merchant) => router.push(`/merchant/${m.id}`);

  const onNavigate = (m: Merchant) => {
    const links = navLinks(m.lat, m.lng, m.name?.zh || "");
    // 三选一：iOS 上优先高德 URI，失败则苹果地图
    Linking.openURL(links.amap).catch(() => Linking.openURL(links.apple));
  };

  const catLabel = (catId: string) =>
    catId === "all" ? t("home.viewAll") : t(`categories.${catId}`);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* 顶栏：返回 + 城市切换 + 搜索 */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.citySwitch}>
          {config.CITIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.cityItem, city.id === c.id && styles.cityActive]}
              onPress={() => switchCity(c)}
            >
              <Text style={[styles.cityText, city.id === c.id && styles.cityTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={() => router.push("/search")}>
          <Ionicons name="search" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 分类横条 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catBar}
        contentContainerStyle={styles.catContent}
      >
        <TouchableOpacity
          style={[styles.catItem, category === "all" && styles.catActive]}
          onPress={() => setCategory("all")}
        >
          <Text style={[styles.catText, category === "all" && styles.catTextActive]}>{t("home.viewAll")}</Text>
        </TouchableOpacity>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.catItem, category === c.id && styles.catActive]}
            onPress={() => setCategory(c.id)}
          >
            <Text style={[styles.catText, category === c.id && styles.catTextActive]}>
              {c.emoji} {catLabel(c.id)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 地图 */}
      <View style={styles.mapWrap}>
        <MerchantMap
          ref={mapRef}
          merchants={filtered}
          center={city.center}
          selectedId={selected?.id}
          userLocation={location}
          onMarkerPress={(m) => setSelected(m)}
        />

        {/* 回到中心按钮 */}
        <TouchableOpacity
          style={[styles.locateBtn, { bottom: selected ? 190 : 30 }]}
          onPress={goBackToCenter}
        >
          <Ionicons name="locate" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* 商户数量角标 */}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {filtered.length} {t("home.nearby")}
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </View>

      {/* 底部信息卡（选中商户） */}
      {selected && (
        <View style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {selected.name?.zh || selected.name?.en}
              </Text>
              {selected.featured && (
                <View style={styles.sponsoredBadge}>
                  <Text style={styles.sponsoredText}>{t("common.sponsored")}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardRating}>⭐ {selected.rating?.toFixed(1)}</Text>
          </View>
          <Text style={styles.cardSub} numberOfLines={1}>
            {t(`categories.${selected.category}`)} · {selected.address?.zh || selected.address?.en}
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]} onPress={() => goDetail(selected)}>
              <Text style={styles.actionPrimaryText}>{t("detail.navigate")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigate(selected)}>
              <Ionicons name="navigate" size={15} color={colors.primary} />
              <Text style={styles.actionText}>{t("detail.openAmap")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                if (selected.phone) Linking.openURL(`tel:${selected.phone}`);
              }}
            >
              <Ionicons name="call" size={15} color={colors.primary} />
              <Text style={styles.actionText}>{t("detail.phone")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 6 },
  searchBtn: { padding: 8, marginLeft: 8 },
  citySwitch: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 3,
    marginHorizontal: 8,
  },
  cityItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 13,
    alignItems: "center",
  },
  cityActive: { backgroundColor: colors.primary },
  cityText: { fontSize: 13, color: colors.textLight, fontWeight: "600" },
  cityTextActive: { color: colors.white, fontWeight: "700" },
  catBar: {
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  catContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  catItem: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.background },
  catActive: { backgroundColor: colors.primary },
  catText: { fontSize: 13, color: colors.textLight, fontWeight: "600" },
  catTextActive: { color: colors.white, fontWeight: "700" },
  mapWrap: { flex: 1 },
  locateBtn: {
    position: "absolute",
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  countBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "rgba(26,26,46,0.75)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: { color: colors.white, fontSize: 12, fontWeight: "600" },
  loadingWrap: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  bottomCard: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitleWrap: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, flexShrink: 1 },
  sponsoredBadge: {
    marginLeft: 6,
    backgroundColor: colors.gold,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sponsoredText: { color: colors.white, fontSize: 10, fontWeight: "700" },
  cardRating: { fontSize: 14, fontWeight: "700", color: colors.gold },
  cardSub: { fontSize: 12, color: colors.textLight, marginTop: 4, marginBottom: 10 },
  cardActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  actionPrimary: { backgroundColor: colors.primary },
  actionPrimaryText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  actionText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
});
