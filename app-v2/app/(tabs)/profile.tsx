import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useI18n } from "@/lib/i18n";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

type ProfileTab = "orders" | "favorites";

export default function ProfileScreen() {
  const { t, language, setLanguage } = useI18n();
  const colors = useColors();

  const { user, isAuthenticated, logout } = useAuth();
  const ordersQuery = trpc.user.orders.list.useQuery(undefined, { enabled: isAuthenticated });
  const favoritesQuery = trpc.user.favorites.list.useQuery(undefined, { enabled: isAuthenticated });
  const [activeTab, setActiveTab] = useState<ProfileTab>("orders");
  const [showLangPicker, setShowLangPicker] = useState(false);

  const handleLogin = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/login");
  }, []);

  const handleLangChange = useCallback(
    (lang: "zh" | "ru" | "en") => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setLanguage(lang);
      setShowLangPicker(false);
    },
    [setLanguage]
  );

  const s = styles(colors);
  const orders = ordersQuery.data ?? [];
  const favorites = favoritesQuery.data ?? [];
  const ordersToUse = orders.filter((order) => order.status === "pending" || order.status === "confirmed").length;
  const ordersCompleted = orders.filter((order) => order.status === "completed").length;
  const ordersRefunded = orders.filter((order) => order.status === "cancelled").length;

  const LANGUAGES = [
    { key: "zh" as const, label: "中文" },
    { key: "ru" as const, label: "Русский" },
    { key: "en" as const, label: "English" },
  ];

  const ORDER_STATUS_TABS = [
    { key: "orders" as ProfileTab, label: t.myOrders },
    { key: "favorites" as ProfileTab, label: t.myFavorites },
  ];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── User Card ── */}
        <View style={[s.userCard, { backgroundColor: colors.primary }]}>
          {isAuthenticated && user ? (
            <View style={s.userInfo}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarText}>{(user.name ?? user.email ?? "边")[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.userName}>{user.name ?? user.email ?? "边小二用户"}</Text>
                <Text style={s.userPhone}>{user.email ?? "已完成统一身份登录"}</Text>
                <View style={s.levelBadge}>
                  <Text style={s.levelText}>已登录用户</Text>
                </View>
              </View>
              <Pressable style={({ pressed }) => [s.editBtn, pressed && { opacity: 0.7 }]}>
                <IconSymbol name="pencil" size={18} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View style={s.guestInfo}>
              <View style={[s.avatarCircle, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                <IconSymbol name="person.fill" size={32} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.guestTitle}>{t.loginTitle}</Text>
                <Text style={s.guestSubtitle}>{t.loginSubtitle}</Text>
              </View>
              <Pressable
                onPress={handleLogin}
                style={({ pressed }) => [s.loginBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={s.loginBtnText}>{t.login}</Text>
              </Pressable>
            </View>
          )}

          {/* Stats Row */}
          <View style={s.statsRow}>
            {[
              { label: t.ordersToUse, value: ordersToUse },
              { label: t.ordersCompleted, value: ordersCompleted },
              { label: t.ordersRefunded, value: ordersRefunded },
            ].map((stat, i) => (
              <View key={i} style={s.statItem}>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Orders / Favorites Tabs ── */}
        <View style={[s.tabCard, { backgroundColor: colors.background }]}>
          <View style={s.tabBar}>
            {ORDER_STATUS_TABS.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={s.tabItem}
              >
                <Text style={[s.tabText, { color: activeTab === tab.key ? colors.primary : colors.muted }]}>
                  {tab.label}
                </Text>
                {activeTab === tab.key && (
                  <View style={[s.tabIndicator, { backgroundColor: colors.primary }]} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Orders */}
          {activeTab === "orders" && (
            <View style={s.tabContent}>
              {!isAuthenticated || orders.length === 0 ? (
                <View style={s.emptyState}>
                  <Text style={[s.emptyText, { color: colors.muted }]}>{t.noOrders}</Text>
                </View>
              ) : (
                orders.map((order) => (
                  <Pressable
                    key={order.id}
                    style={({ pressed }) => [
                      s.orderCard,
                      { borderColor: colors.border },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[s.orderTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {order.items[0]?.title ?? "订单商品"}
                      </Text>
                      <Text style={[s.orderMerchant, { color: colors.muted }]}>{order.merchantName[language]}</Text>
                      <Text style={[s.orderDate, { color: colors.muted }]}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <Text style={[s.orderPrice, { color: colors.primary }]}>¥{(order.totalCents / 100).toFixed(2)}</Text>
                      <View
                        style={[
                          s.orderStatusBadge,
                          {
                            backgroundColor:
                              order.status === "pending" || order.status === "confirmed"
                                ? colors.primary + "15"
                                : colors.success + "15",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            s.orderStatusText,
                            {
                              color:
                                order.status === "pending" || order.status === "confirmed" ? colors.primary : colors.success,
                            },
                          ]}
                        >
                          {order.status === "pending" || order.status === "confirmed" ? t.ordersToUse : t.ordersCompleted}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Favorites */}
          {activeTab === "favorites" && (
            <View style={s.tabContent}>
              {!isAuthenticated || favorites.length === 0 ? (
                <View style={s.emptyState}>
                  <Text style={[s.emptyText, { color: colors.muted }]}>{t.noFavorites}</Text>
                </View>
              ) : (
                favorites.map((fav) => (
                  <Pressable
                    key={fav.id}
                    style={({ pressed }) => [
                      s.favCard,
                      { borderColor: colors.border },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => router.push(`/merchant/${fav.id}`)}>
                    <View style={[s.favIcon, { backgroundColor: colors.primary + "15" }]}>
                      <IconSymbol name="heart.fill" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.favName, { color: colors.foreground }]}>{fav.name[language]}</Text>
                      <View style={s.favMeta}>
                        <IconSymbol name="star.fill" size={12} color="#FFB800" />
                        <Text style={[s.favRating, { color: colors.muted }]}>{fav.rating}</Text>
                      </View>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                  </Pressable>
                ))
              )}
            </View>
          )}
        </View>

        {/* ── Settings ── */}
        <View style={[s.settingsCard, { backgroundColor: colors.background }]}>
          {/* Language */}
          <Pressable
            onPress={() => setShowLangPicker((v) => !v)}
            style={({ pressed }) => [s.settingRow, { borderBottomColor: colors.border }, pressed && { opacity: 0.7 }]}
          >
            <View style={[s.settingIcon, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="globe.asia.australia.fill" size={18} color={colors.primary} />
            </View>
            <Text style={[s.settingLabel, { color: colors.foreground }]}>
              {language === "zh" ? "语言" : language === "ru" ? "Язык" : "Language"}
            </Text>
            <Text style={[s.settingValue, { color: colors.muted }]}>
              {language === "zh" ? "中文" : language === "ru" ? "Русский" : "English"}
            </Text>
            <IconSymbol
              name={showLangPicker ? "chevron.right" : "chevron.right"}
              size={14}
              color={colors.muted}
            />
          </Pressable>

          {/* Language Picker */}
          {showLangPicker && (
            <View style={[s.langPicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.key}
                  onPress={() => handleLangChange(lang.key)}
                  style={({ pressed }) => [
                    s.langOption,
                    { borderBottomColor: colors.border },
                    pressed && { backgroundColor: colors.primary + "10" },
                  ]}
                >
                  <Text style={[s.langOptionText, { color: language === lang.key ? colors.primary : colors.foreground }]}>
                    {lang.label}
                  </Text>
                  {language === lang.key && (
                    <IconSymbol name="checkmark" size={16} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {/* Help */}
          {[
            { icon: "questionmark.circle.fill" as const, label: t.helpCenter, color: colors.warning },
            { icon: "envelope.fill" as const, label: t.contactUs, color: colors.success },
            { icon: "shield.fill" as const, label: t.privacyPolicy, color: colors.primary },
          ].map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [s.settingRow, { borderBottomColor: colors.border }, pressed && { opacity: 0.7 }]}
            >
              <View style={[s.settingIcon, { backgroundColor: item.color + "15" }]}>
                <IconSymbol name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={[s.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
              <View style={{ flex: 1 }} />
              <IconSymbol name="chevron.right" size={14} color={colors.muted} />
            </Pressable>
          ))}

          {/* Version */}
          <View style={[s.settingRow, { borderBottomWidth: 0 }]}>
            <View style={[s.settingIcon, { backgroundColor: colors.muted + "15" }]}>
              <IconSymbol name="iphone" size={18} color={colors.muted} />
            </View>
            <Text style={[s.settingLabel, { color: colors.foreground }]}>{t.version}</Text>
            <View style={{ flex: 1 }} />
            <Text style={[s.settingValue, { color: colors.muted }]}>1.0.0</Text>
          </View>
        </View>

        {/* Logout */}
          {isAuthenticated && user && (
          <Pressable
            onPress={() => { void logout(); }}
            style={({ pressed }) => [
              s.logoutBtn,
              { backgroundColor: colors.error + "15", borderColor: colors.error + "40" },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[s.logoutText, { color: colors.error }]}>{t.logout}</Text>
          </Pressable>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    userCard: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 0, marginBottom: 12 },
    userInfo: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
    guestInfo: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
    avatarCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "rgba(255,255,255,0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 26, fontWeight: "700", color: "#fff" },
    userName: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 4 },
    userPhone: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 6 },
    levelBadge: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(255,255,255,0.25)",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    levelText: { fontSize: 11, color: "#fff" },
    editBtn: { padding: 8 },
    guestTitle: { fontSize: 17, fontWeight: "700", color: "#fff", marginBottom: 4 },
    guestSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
    loginBtn: {
      backgroundColor: "#fff",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    loginBtnText: { fontSize: 14, fontWeight: "700", color: colors.primary },
    statsRow: {
      flexDirection: "row",
      backgroundColor: "rgba(0,0,0,0.15)",
      borderRadius: 12,
      marginBottom: 16,
    },
    statItem: { flex: 1, alignItems: "center", paddingVertical: 14 },
    statValue: { fontSize: 20, fontWeight: "700", color: "#fff" },
    statLabel: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 },
    tabCard: { marginBottom: 12 },
    tabBar: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: colors.border },
    tabItem: { flex: 1, alignItems: "center", paddingVertical: 14, position: "relative" },
    tabText: { fontSize: 14, fontWeight: "600" },
    tabIndicator: { position: "absolute", bottom: 0, height: 2, width: "50%", borderRadius: 1 },
    tabContent: { padding: 16 },
    emptyState: { alignItems: "center", paddingVertical: 32 },
    emptyText: { fontSize: 14 },
    orderCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      gap: 12,
    },
    orderTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
    orderMerchant: { fontSize: 12, marginBottom: 2 },
    orderDate: { fontSize: 11 },
    orderPrice: { fontSize: 16, fontWeight: "700" },
    orderStatusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    orderStatusText: { fontSize: 11, fontWeight: "600" },
    favCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      gap: 12,
    },
    favIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    favName: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
    favMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
    favRating: { fontSize: 12 },
    settingsCard: { marginBottom: 12, paddingHorizontal: 16 },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      gap: 12,
    },
    settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    settingLabel: { fontSize: 15 },
    settingValue: { fontSize: 13 },
    langPicker: {
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 8,
      overflow: "hidden",
    },
    langOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
    },
    langOptionText: { fontSize: 15 },
    logoutBtn: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    logoutText: { fontSize: 15, fontWeight: "600" },
  });
