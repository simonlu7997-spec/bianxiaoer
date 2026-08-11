import React from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import { router } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = SCREEN_WIDTH / 5;

interface ServiceItem {
  key: string;
  icon: string;
  iconName: React.ComponentProps<typeof IconSymbol>["name"];
  color: string;
  bgColor: string;
  isMap?: boolean;
}

const SERVICE_ITEMS: ServiceItem[] = [
  {
    key: "accommodation",
    icon: "🏨",
    iconName: "bed.double.fill",
    color: "#1A6FB5",
    bgColor: "#E6F2FF",
  },
  {
    key: "transport",
    icon: "🚗",
    iconName: "car.fill",
    color: "#22C55E",
    bgColor: "#DCFCE7",
  },
  {
    key: "dining",
    icon: "🍽️",
    iconName: "fork.knife",
    color: "#FF6B35",
    bgColor: "#FFF0EB",
  },
  {
    key: "delivery",
    icon: "🛵",
    iconName: "bag.fill",
    color: "#F59E0B",
    bgColor: "#FEF9C3",
  },
  {
    key: "shopping",
    icon: "🛍️",
    iconName: "bag.circle.fill",
    color: "#8B5CF6",
    bgColor: "#F3E8FF",
  },
  {
    key: "carRepair",
    icon: "🔧",
    iconName: "wrench.and.screwdriver.fill",
    color: "#6B7280",
    bgColor: "#F3F4F6",
  },
  {
    key: "beauty",
    icon: "💇",
    iconName: "scissors",
    color: "#EC4899",
    bgColor: "#FCE7F3",
  },
  {
    key: "entertainment",
    icon: "🎮",
    iconName: "gamecontroller.fill",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
  },
  {
    key: "logistics",
    icon: "📦",
    iconName: "shippingbox.fill",
    color: "#F97316",
    bgColor: "#FFF7ED",
  },
  {
    key: "trade",
    icon: "🌐",
    iconName: "globe.asia.australia.fill",
    color: "#0EA5E9",
    bgColor: "#E0F2FE",
  },
  {
    key: "map",
    icon: "🗺️",
    iconName: "map.fill",
    color: "#2E6BE6",
    bgColor: "#E8F0FE",
    isMap: true,
  },
];

export function ServiceGrid() {
  const colors = useColors();
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {SERVICE_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [
              styles.item,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              if ("isMap" in item && item.isMap) {
                router.push("/map");
                return;
              }
              router.push({ pathname: "/search", params: { category: item.key } });
            }}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
              <IconSymbol name={item.iconName} size={28} color={item.color} />
            </View>
            <Text style={[styles.label, { color: colors.foreground }]} numberOfLines={1}>
              {t.services[item.key as keyof typeof t.services] ?? "地图"}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  item: {
    width: ITEM_WIDTH,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
});
