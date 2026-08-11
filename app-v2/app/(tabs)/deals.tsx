import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import type { DealSummary, ServiceCategory } from "@/shared/bianxiaoer";

const CATEGORIES: { key: "all" | ServiceCategory; label: Record<"zh" | "ru" | "en", string> }[] = [
  { key: "all", label: { zh: "全部", ru: "Все", en: "All" } },
  { key: "dining", label: { zh: "餐饮", ru: "Еда", en: "Dining" } },
  { key: "accommodation", label: { zh: "住宿", ru: "Отели", en: "Stay" } },
  { key: "entertainment", label: { zh: "娱乐", ru: "Отдых", en: "Leisure" } },
  { key: "beauty", label: { zh: "美容", ru: "Красота", en: "Beauty" } },
];

function localized(value: Record<"zh" | "ru" | "en", string>, language: "zh" | "ru" | "en") { return value[language] || value.zh; }

function Countdown({ expiresAt }: { expiresAt: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!expiresAt) return; const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, [expiresAt]);
  if (!expiresAt) return null;
  const remaining = new Date(expiresAt).getTime() - now;
  if (remaining <= 0) return <Text style={styles.expired}>已结束</Text>;
  const hours = Math.floor(remaining / 3_600_000); const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return <Text style={styles.countdown}>剩余 {hours}时{minutes}分</Text>;
}

function DealCard({ item, language, colors }: { item: DealSummary; language: "zh" | "ru" | "en"; colors: ReturnType<typeof useColors> }) {
  const discount = item.originalPriceCents ? Math.round((item.currentPriceCents / item.originalPriceCents) * 10) : null;
  return <Pressable onPress={() => router.push({ pathname: "/deal/[id]", params: { id: item.id.toString() } })} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.9 }]}>
    <View style={[styles.cover, { backgroundColor: colors.primary + "12" }]}><IconSymbol name="tag.fill" size={36} color={colors.primary} />{discount ? <View style={[styles.discount, { backgroundColor: colors.error }]}><Text style={styles.discountText}>{discount}折</Text></View> : null}</View>
    <View style={styles.content}><Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>{localized(item.title, language)}</Text><Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }} numberOfLines={1}>{localized(item.merchantName, language)}</Text><View style={styles.priceRow}><Text style={[styles.price, { color: colors.primary }]}>¥{(item.currentPriceCents / 100).toFixed(2)}</Text>{item.originalPriceCents ? <Text style={[styles.original, { color: colors.muted }]}>¥{(item.originalPriceCents / 100).toFixed(2)}</Text> : null}<View style={{ flex: 1 }} /><Countdown expiresAt={item.expiresAt} /></View><Text style={{ color: colors.muted, fontSize: 12 }}>已售 {item.soldCount}</Text></View>
  </Pressable>;
}

export default function DealsScreen() {
  const { language, t } = useI18n();
  const colors = useColors();
  const [activeCategory, setActiveCategory] = useState<"all" | ServiceCategory>("all");
  const query = trpc.catalog.deals.useQuery({ limit: 30, ...(activeCategory === "all" ? {} : { category: activeCategory }) });
  return <ScreenContainer edges={["top", "left", "right"]}><View style={styles.header}><Text style={[styles.headerTitle, { color: colors.foreground }]}>{t.deals}</Text><Pressable onPress={() => router.push("/search")}><IconSymbol name="magnifyingglass" size={22} color={colors.foreground} /></Pressable></View><FlatList horizontal data={CATEGORIES} keyExtractor={(item) => item.key} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories} renderItem={({ item }) => <Pressable onPress={() => setActiveCategory(item.key)} style={[styles.category, { backgroundColor: activeCategory === item.key ? colors.primary : colors.surface, borderColor: colors.border }]}><Text style={{ color: activeCategory === item.key ? "#fff" : colors.foreground }}>{localized(item.label, language)}</Text></Pressable>} /><FlatList data={query.data ?? []} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => <DealCard item={item} language={language} colors={colors} />} contentContainerStyle={styles.list} ListEmptyComponent={query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} /> : <Text style={{ color: colors.muted, textAlign: "center", marginTop: 48 }}>暂无可用团购。</Text>} /></ScreenContainer>;
}

const styles = StyleSheet.create({ header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }, headerTitle: { fontSize: 22, fontWeight: "800" }, categories: { gap: 8, paddingHorizontal: 16, paddingBottom: 12 }, category: { borderWidth: 0.5, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 }, list: { paddingHorizontal: 16, paddingBottom: 28 }, card: { overflow: "hidden", borderWidth: 0.5, borderRadius: 14, marginBottom: 14 }, cover: { height: 120, alignItems: "center", justifyContent: "center", position: "relative" }, discount: { position: "absolute", top: 10, left: 10, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 }, discountText: { color: "#fff", fontSize: 12, fontWeight: "800" }, content: { padding: 13 }, title: { fontSize: 16, fontWeight: "700", lineHeight: 23 }, priceRow: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 10, marginBottom: 5 }, price: { fontSize: 20, fontWeight: "800" }, original: { fontSize: 13, textDecorationLine: "line-through" }, countdown: { color: "#D9485F", fontSize: 12, fontWeight: "600" }, expired: { color: "#8A8F98", fontSize: 12 }, });
