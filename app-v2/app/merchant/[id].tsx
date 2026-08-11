import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";

type TabKey = "menu" | "reviews" | "info";

function localized(value: Record<"zh" | "ru" | "en", string>, language: "zh" | "ru" | "en") {
  return value[language] || value.zh;
}

export default function MerchantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const merchantId = Number(id);
  const { t, language } = useI18n();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState<TabKey>("menu");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  const favoritesQuery = trpc.user.favorites.list.useQuery(undefined, { enabled: isAuthenticated });
  const toggleFavorite = trpc.user.favorites.toggle.useMutation({ onSuccess: () => void favoritesQuery.refetch() });
  const query = trpc.catalog.merchantById.useQuery({ id: Number.isInteger(merchantId) && merchantId > 0 ? merchantId : 0 }, { enabled: Number.isInteger(merchantId) && merchantId > 0 });
  const merchant = query.data;
  const isFavorited = merchant ? Boolean(favoritesQuery.data?.some((favorite) => favorite.id === merchant.id)) : false;

  useEffect(() => {
    if (merchant && selectedCategory === null) setSelectedCategory(merchant.menuCategories[0]?.id ?? null);
  }, [merchant, selectedCategory]);

  const currentItems = useMemo(
    () => merchant?.menuCategories.find((category) => category.id === selectedCategory)?.items ?? [],
    [merchant, selectedCategory],
  );

  const handleCall = useCallback(() => {
    if (!merchant?.phone) return Alert.alert("", "该商户暂未提供联系电话。");
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(`tel:${merchant.phone}`).catch(() => Alert.alert("", merchant.phone ?? ""));
  }, [merchant?.phone]);

  const handleNavigate = useCallback(() => {
    if (!merchant?.latitude || !merchant.longitude) return Alert.alert("", "该商户暂未配置地图坐标。");
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const destination = `${merchant.longitude},${merchant.latitude},${localized(merchant.name, language)}`;
    const navigationUrl = `https://uri.amap.com/navigation?to=${encodeURIComponent(destination)}&mode=car&policy=0&src=bianxiaoer&callnative=1`;
    void Linking.openURL(navigationUrl).catch(() => Alert.alert("", merchant.address ?? destination));
  }, [language, merchant?.address, merchant?.latitude, merchant?.longitude, merchant?.name]);

  const handleFavorite = useCallback(() => {
    if (!merchant) return;
    if (!isAuthenticated) return void router.push("/login");
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void toggleFavorite.mutateAsync({ merchantId: merchant.id }).catch(() => Alert.alert("", "收藏操作失败，请稍后重试。"));
  }, [isAuthenticated, merchant, toggleFavorite]);

  const handleAddToCart = useCallback((item: NonNullable<typeof merchant>["menuCategories"][number]["items"][number]) => {
    if (!merchant) return;
    if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addItem({ id: `menu-${item.id}`, merchantId: merchant.id.toString(), merchantName: localized(merchant.name, language), name: localized(item.name, language), imageUrl: item.imageUrl ?? "", price: item.priceCents / 100, quantity: 1 });
    Alert.alert("", t.cartAddSuccess);
  }, [addItem, language, merchant, t.cartAddSuccess]);

  if (query.isLoading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  if (!merchant) return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.muted }}>未找到该商户。</Text><Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.primary }]}><Text style={styles.backText}>返回</Text></Pressable></View>;

  const name = localized(merchant.name, language);
  const tabs: { key: TabKey; label: string }[] = [{ key: "menu", label: t.menu }, { key: "reviews", label: t.reviewsTab }, { key: "info", label: t.info }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}><IconSymbol name="chevron.left" size={24} color={colors.foreground} /></Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
        <Pressable onPress={handleFavorite} style={styles.headerButton}><IconSymbol name={isFavorited ? "heart.fill" : "heart"} size={22} color={isFavorited ? colors.error : colors.foreground} /></Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 112 }}>
        <View style={[styles.cover, { backgroundColor: colors.surface }]}>
          {merchant.coverImageUrl ? <Image source={{ uri: merchant.coverImageUrl }} style={styles.coverImage} /> : <IconSymbol name="fork.knife" size={48} color={colors.muted} />}
          <View style={styles.ratingBadge}><IconSymbol name="star.fill" size={14} color="#FFB800" /><Text style={styles.ratingText}>{merchant.rating.toFixed(1)} ({merchant.reviewCount})</Text></View>
        </View>
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.name, { color: colors.foreground }]}>{name}</Text>
          <View style={styles.tags}>{merchant.tags.map((tag) => <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + "18" }]}><Text style={{ color: colors.primary, fontSize: 12 }}>{tag}</Text></View>)}</View>
          <Text style={{ color: merchant.isOpen ? colors.success : colors.error, fontSize: 13 }}>{merchant.isOpen ? t.open : t.closed}{merchant.distanceKm !== null ? ` · ${merchant.distanceKm.toFixed(1)} ${t.distance}` : ""}</Text>
        </View>
        <View style={[styles.actions, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleCall} style={styles.action}><IconSymbol name="phone.fill" size={20} color={colors.success} /><Text style={{ color: colors.foreground, fontSize: 12 }}>{t.callMerchant}</Text></Pressable>
          <Pressable onPress={handleNavigate} style={styles.action}><IconSymbol name="map.fill" size={20} color={colors.primary} /><Text style={{ color: colors.foreground, fontSize: 12 }}>{t.navigate}</Text></Pressable>
          <Pressable onPress={handleFavorite} style={styles.action}><IconSymbol name={isFavorited ? "heart.fill" : "heart"} size={20} color={colors.error} /><Text style={{ color: colors.foreground, fontSize: 12 }}>{isFavorited ? t.unfavorite : t.favorite}</Text></Pressable>
        </View>
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>{tabs.map((tab) => <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={styles.tab}><Text style={{ color: activeTab === tab.key ? colors.primary : colors.muted, fontWeight: activeTab === tab.key ? "700" : "400" }}>{tab.label}</Text>{activeTab === tab.key ? <View style={[styles.indicator, { backgroundColor: colors.primary }]} /> : null}</Pressable>)}</View>
        {activeTab === "menu" ? <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>{merchant.menuCategories.map((category) => <Pressable key={category.id} onPress={() => setSelectedCategory(category.id)} style={[styles.category, { borderColor: selectedCategory === category.id ? colors.primary : colors.border, backgroundColor: selectedCategory === category.id ? colors.primary + "18" : colors.surface }]}><Text style={{ color: selectedCategory === category.id ? colors.primary : colors.foreground }}>{localized(category.name, language)}</Text></Pressable>)}</ScrollView>
          {currentItems.map((item) => <View key={item.id} style={[styles.menuItem, { borderBottomColor: colors.border }]}><View style={[styles.thumb, { backgroundColor: colors.surface }]}>{item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} /> : <IconSymbol name="fork.knife" size={24} color={colors.muted} />}</View><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontWeight: "600" }}>{localized(item.name, language)}</Text>{localized(item.description, language) ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }} numberOfLines={2}>{localized(item.description, language)}</Text> : null}<Text style={{ color: colors.primary, fontWeight: "700", marginTop: 6 }}>¥{(item.priceCents / 100).toFixed(2)} <Text style={{ color: colors.muted, fontWeight: "400" }}>/{localized(item.unit, language)}</Text></Text></View><Pressable onPress={() => handleAddToCart(item)} style={[styles.addButton, { backgroundColor: colors.primary }]}><IconSymbol name="plus" size={18} color="#fff" /></Pressable></View>)}
          {currentItems.length === 0 ? <Text style={{ color: colors.muted, textAlign: "center", paddingVertical: 32 }}>该分类暂未配置菜品。</Text> : null}
        </View> : null}
        {activeTab === "reviews" ? <View style={styles.section}>{merchant.reviews.length === 0 ? <Text style={{ color: colors.muted, textAlign: "center", paddingVertical: 32 }}>{t.noReviews}</Text> : merchant.reviews.map((review) => <View key={review.id} style={[styles.review, { borderBottomColor: colors.border }]}><Text style={{ color: colors.foreground, fontWeight: "600" }}>{review.userDisplayName} · {"★".repeat(review.rating)}</Text><Text style={{ color: colors.foreground, marginTop: 6 }}>{review.content}</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>{new Date(review.createdAt).toLocaleDateString()}</Text></View>)}</View> : null}
        {activeTab === "info" ? <View style={styles.section}>{[[t.address, merchant.address], [t.phone, merchant.phone], [t.businessHours, merchant.businessHours]].map(([label, value]) => <View key={label} style={[styles.infoRow, { borderBottomColor: colors.border }]}><Text style={{ color: colors.muted, width: 92 }}>{label}</Text><Text style={{ color: colors.foreground, flex: 1 }}>{value || "暂未提供"}</Text></View>)}<Text style={{ color: colors.foreground, fontWeight: "600", marginTop: 18 }}>{t.info}</Text><Text style={{ color: colors.muted, lineHeight: 21, marginTop: 8 }}>{localized(merchant.description, language) || "暂未提供商户介绍。"}</Text></View> : null}
      </ScrollView>
      <View style={[styles.bottom, { borderTopColor: colors.border, paddingBottom: insets.bottom + 10, backgroundColor: colors.background }]}><Pressable onPress={handleCall} style={[styles.call, { borderColor: colors.primary }]}><Text style={{ color: colors.primary, fontWeight: "700" }}>{t.callMerchant}</Text></Pressable><Pressable onPress={() => setActiveTab("menu")} style={[styles.order, { backgroundColor: colors.primary }]}><Text style={styles.orderText}>{t.buyNow}</Text></Pressable></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }, backButton: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 11 }, backText: { color: "#fff", fontWeight: "700" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 0.5 }, headerButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" }, headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700" },
  cover: { height: 210, alignItems: "center", justifyContent: "center", position: "relative" }, coverImage: { width: "100%", height: "100%" }, ratingBadge: { position: "absolute", right: 14, bottom: 14, flexDirection: "row", gap: 4, alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.65)" }, ratingText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  section: { padding: 16, borderBottomWidth: 0.5 }, name: { fontSize: 21, fontWeight: "800" }, tags: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginVertical: 10 }, tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  actions: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 15, borderBottomWidth: 0.5 }, action: { alignItems: "center", gap: 6, minWidth: 56 }, tabs: { flexDirection: "row", borderBottomWidth: 0.5 }, tab: { flex: 1, alignItems: "center", paddingVertical: 14, position: "relative" }, indicator: { bottom: 0, height: 2, width: 34, position: "absolute", borderRadius: 2 },
  categoryRow: { gap: 8, paddingBottom: 12 }, category: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 }, menuItem: { flexDirection: "row", gap: 12, paddingVertical: 13, alignItems: "center", borderBottomWidth: 0.5 }, thumb: { width: 64, height: 64, borderRadius: 10, alignItems: "center", justifyContent: "center", overflow: "hidden" }, thumbImage: { width: "100%", height: "100%" }, addButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  review: { paddingVertical: 14, borderBottomWidth: 0.5 }, infoRow: { flexDirection: "row", paddingVertical: 13, borderBottomWidth: 0.5 }, bottom: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 0.5 }, call: { height: 48, flex: 1, borderWidth: 1.5, alignItems: "center", justifyContent: "center", borderRadius: 12 }, order: { height: 48, flex: 1.5, alignItems: "center", justifyContent: "center", borderRadius: 12 }, orderText: { color: "#fff", fontWeight: "800" },
});
