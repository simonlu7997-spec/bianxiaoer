import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { SERVICE_CATEGORIES, type DealSummary, type MerchantSummary, type ServiceCategory } from "@/shared/bianxiaoer";
import * as Haptics from "expo-haptics";

const HISTORY_KEY = "@bianxiaoer_search_history";
const MAX_HISTORY = 10;
const HOT_KEYWORDS = ["烤肉", "住宿", "团购", "跨境物流", "美发", "大盘鸡", "购物", "汽修", "娱乐", "国际贸易"];

function ResultImage({ uri }: { uri: string | null }) {
  const colors = useColors();
  if (!uri) {
    return (
      <View style={[styles.resultImage, styles.imageFallback, { backgroundColor: colors.border }]}>
        <IconSymbol name="photo.fill" size={20} color={colors.muted} />
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.resultImage} contentFit="cover" />;
}

function MerchantResult({ item }: { item: MerchantSummary }) {
  const colors = useColors();
  const { language, t } = useI18n();
  return (
    <Pressable style={[styles.resultRow, { borderBottomColor: colors.border }]} onPress={() => router.push(`/merchant/${item.id}`)}>
      <ResultImage uri={item.coverImageUrl} />
      <View style={styles.resultInfo}>
        <Text style={[styles.resultName, { color: colors.foreground }]}>{item.name[language]}</Text>
        <Text style={[styles.resultSub, { color: colors.muted }]}>
          {item.category} · ★ {item.rating.toFixed(1)} · {item.distanceKm === null ? "—" : item.distanceKm.toFixed(1)} {t.distance}
        </Text>
        <View style={[styles.openBadge, { backgroundColor: item.isOpen ? "#22C55E20" : "#9CA3AF20" }]}>
          <Text style={{ fontSize: 11, color: item.isOpen ? "#22C55E" : "#9CA3AF" }}>{item.isOpen ? t.open : t.closed}</Text>
        </View>
      </View>
      <IconSymbol name="chevron.right" size={16} color={colors.muted} />
    </Pressable>
  );
}

function DealResult({ item }: { item: DealSummary }) {
  const colors = useColors();
  const { language } = useI18n();
  return (
    <Pressable style={[styles.resultRow, { borderBottomColor: colors.border }]} onPress={() => router.push({ pathname: "/deal/[id]", params: { id: item.id.toString() } })}>
      <ResultImage uri={item.coverImageUrl} />
      <View style={styles.resultInfo}>
        <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={2}>{item.title[language]}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.dealPrice, { color: colors.primary }]}>¥{(item.currentPriceCents / 100).toFixed(2)}</Text>
          {item.originalPriceCents !== null && <Text style={[styles.originalPrice, { color: colors.muted }]}>¥{(item.originalPriceCents / 100).toFixed(2)}</Text>}
        </View>
      </View>
      <IconSymbol name="chevron.right" size={16} color={colors.muted} />
    </Pressable>
  );
}

export default function SearchScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const inputRef = useRef<TextInput>(null);
  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const selectedCategory = SERVICE_CATEGORIES.includes(rawCategory as ServiceCategory) ? rawCategory as ServiceCategory : undefined;
  const initialQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const [query, setQuery] = useState(initialQuery ?? "");
  const [history, setHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"merchants" | "deals">("merchants");
  const normalizedQuery = query.trim();
  const searchActive = normalizedQuery.length > 0 || Boolean(selectedCategory);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((value) => typeof value === "string")) setHistory(parsed);
      } catch {
        setHistory([]);
      }
    });
    const timeout = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timeout);
  }, []);

  const merchantQuery = trpc.catalog.merchants.useQuery(
    { category: selectedCategory, keyword: normalizedQuery || undefined, limit: 20 },
    { enabled: searchActive },
  );
  const dealsQuery = trpc.catalog.deals.useQuery(
    { limit: 20, category: selectedCategory, keyword: normalizedQuery || undefined },
    { enabled: searchActive },
  );
  const matchingDeals = dealsQuery.data ?? [];

  const saveHistory = useCallback(async (keyword: string) => {
    const updated = [keyword, ...history.filter((entry) => entry !== keyword)].slice(0, MAX_HISTORY);
    setHistory(updated);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }, [history]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  }, []);

  const handleSearch = useCallback((keyword: string) => {
    const value = keyword.trim();
    if (!value) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery(value);
    void saveHistory(value);
    Keyboard.dismiss();
  }, [saveHistory]);

  const merchants = merchantQuery.data ?? [];
  const hasResults = merchants.length > 0 || matchingDeals.length > 0;
  const loading = merchantQuery.isLoading || dealsQuery.isLoading;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.searchBar}>
        <View style={styles.inputWrapper}>
          <IconSymbol name="magnifyingglass" size={16} color="rgba(255,255,255,0.8)" />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={t.searchPlaceholder}
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && <Pressable onPress={() => setQuery("")}><IconSymbol name="xmark.circle.fill" size={16} color="rgba(255,255,255,0.7)" /></Pressable>}
        </View>
        <Pressable onPress={() => router.back()} style={styles.cancelBtn}><Text style={styles.cancelText}>{t.searchCancel}</Text></Pressable>
      </View>

      {!searchActive ? (
        <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
          {history.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.searchHistory}</Text>
                <Pressable onPress={clearHistory}><Text style={[styles.clearBtn, { color: colors.muted }]}>{t.searchClearHistory}</Text></Pressable>
              </View>
              <View style={styles.tagWrap}>
                {history.map((keyword) => <Pressable key={keyword} style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => handleSearch(keyword)}><Text style={[styles.tagText, { color: colors.foreground }]}>{keyword}</Text></Pressable>)}
              </View>
            </View>
          )}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.searchHot}</Text>
            <View style={styles.tagWrap}>
              {HOT_KEYWORDS.map((keyword) => <Pressable key={keyword} style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => handleSearch(keyword)}><Text style={[styles.tagText, { color: colors.foreground }]}>{keyword}</Text></Pressable>)}
            </View>
          </View>
        </ScrollView>
      ) : loading ? (
        <View style={styles.noResult}><Text style={[styles.noResultText, { color: colors.muted }]}>{t.loading}</Text></View>
      ) : hasResults ? (
        <View style={styles.flex}>
          <View style={[styles.tabRow, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
            {(["merchants", "deals"] as const).map((tab) => {
              const count = tab === "merchants" ? merchants.length : matchingDeals.length;
              const label = tab === "merchants" ? t.searchMerchants : t.searchDeals;
              return <Pressable key={tab} style={[styles.tabItem, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setActiveTab(tab)}><Text style={[styles.tabLabel, { color: activeTab === tab ? colors.primary : colors.muted }]}>{label}{count > 0 ? ` (${count})` : ""}</Text></Pressable>;
            })}
          </View>
          {activeTab === "merchants" ? <FlatList data={merchants} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => <MerchantResult item={item} />} ListEmptyComponent={<EmptyResult />} /> : <FlatList data={matchingDeals} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => <DealResult item={item} />} ListEmptyComponent={<EmptyResult />} />}
        </View>
      ) : <EmptyResult />}
    </ScreenContainer>
  );
}

function EmptyResult() {
  const colors = useColors();
  const { t } = useI18n();
  return <View style={styles.noResult}><IconSymbol name="magnifyingglass" size={36} color={colors.muted} /><Text style={[styles.noResultText, { color: colors.foreground }]}>{t.searchNoResult}</Text><Text style={[styles.noResultHint, { color: colors.muted }]}>{t.searchNoResultHint}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 10, backgroundColor: "#1A6FB5" },
  inputWrapper: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, gap: 8, backgroundColor: "rgba(255,255,255,0.15)" },
  input: { flex: 1, fontSize: 15, padding: 0, color: "#FFFFFF" },
  cancelBtn: { paddingHorizontal: 4 },
  cancelText: { color: "#FFFFFF", fontSize: 15, fontWeight: "500" },
  section: { paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  clearBtn: { fontSize: 13 },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5 },
  tagText: { fontSize: 13 },
  tabRow: { flexDirection: "row", borderBottomWidth: 0.5 },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabLabel: { fontSize: 14, fontWeight: "600" },
  resultRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, gap: 12 },
  resultImage: { width: 64, height: 64, borderRadius: 8 },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  resultInfo: { flex: 1, gap: 4 },
  resultName: { fontSize: 14, fontWeight: "600" },
  resultSub: { fontSize: 12 },
  openBadge: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dealPrice: { fontSize: 15, fontWeight: "700" },
  originalPrice: { fontSize: 12, textDecorationLine: "line-through" },
  noResult: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingTop: 80, gap: 8 },
  noResultText: { fontSize: 16, fontWeight: "600" },
  noResultHint: { fontSize: 13, textAlign: "center" },
});
