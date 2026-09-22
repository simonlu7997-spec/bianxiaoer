import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, Platform } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import * as Haptics from "expo-haptics";
import categories from "@/src/data/categories";

const CAT_COLORS: Record<string, string> = {
  food: "#FF6B35",
  shopping: "#3B82F6",
  autorepair: "#F59E0B",
  beauty: "#EC4899",
  leisure: "#8B5CF6",
  logistics: "#10B981",
  hotel: "#0EA5E9",
};

const catEmoji = (category: string) =>
  categories.find((c) => c.id === category)?.emoji ?? "🏪";

const catColor = (category: string) => CAT_COLORS[category] ?? "#64748B";

export interface Merchant {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  rating: number;
  reviewCount: number;
  distance: string;
  isOpen: boolean;
  tags?: string[];
}

interface MerchantCardProps {
  merchant: Merchant;
  onPress?: () => void;
}

export function MerchantCard({ merchant, onPress }: MerchantCardProps) {
  const colors = useColors();
  const { t } = useI18n();

  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress();
    } else {
      router.push(`/merchant/${merchant.id}`);
    }
  }, [merchant.id, onPress]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.85 },
      ]}
      onPress={handlePress}
      >
      <View style={styles.imageContainer}>
        {merchant.imageUrl ? (
          <Image
            source={{ uri: merchant.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.imageFallback, { backgroundColor: catColor(merchant.category) }]}>
            <Text style={styles.fallbackEmoji}>{catEmoji(merchant.category)}</Text>
          </View>
        )}
        <View style={[
          styles.statusBadge,
          { backgroundColor: merchant.isOpen ? "#22C55E" : "#9CA3AF" }
        ]}>
          <Text style={styles.statusText}>
            {merchant.isOpen ? t.open : t.closed}
          </Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {merchant.name}
        </Text>
        <View style={styles.ratingRow}>
          <IconSymbol name="star.fill" size={12} color="#F59E0B" />
          <Text style={[styles.rating, { color: colors.foreground }]}>
            {merchant.rating.toFixed(1)}
          </Text>
          <Text style={[styles.reviews, { color: colors.muted }]}>
            ({merchant.reviewCount}{t.reviews})
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <IconSymbol name="location.fill" size={11} color={colors.muted} />
          <Text style={[styles.distance, { color: colors.muted }]}>
            {merchant.distance}{t.distance}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

interface MerchantListProps {
  merchants: Merchant[];
  title: string;
  loading?: boolean;
  onSeeAll?: () => void;
}

export function MerchantHorizontalList({ merchants, title, loading = false, onSeeAll }: MerchantListProps) {
  const colors = useColors();
  const { t } = useI18n();

  return (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: colors.foreground }]}>{title}</Text>
        <Pressable onPress={onSeeAll} style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <View style={styles.seeAllRow}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>{t.seeAll}</Text>
            <IconSymbol name="chevron.right" size={14} color={colors.primary} />
          </View>
        </Pressable>
      </View>
      {loading ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>{t.loading}</Text>
        </View>
      ) : merchants.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>{t.noData}</Text>
        </View>
      ) : (
        <FlatList
          data={merchants}
          renderItem={({ item }) => (
            <MerchantCard
              merchant={item}
              onPress={() => router.push(`/merchant/${item.id}`)}
            />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: 160,
    height: 110,
  },
  imageFallback: {
    width: 160,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackEmoji: {
    fontSize: 40,
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  info: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rating: {
    fontSize: 12,
    fontWeight: "600",
  },
  reviews: {
    fontSize: 11,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  distance: {
    fontSize: 11,
  },
  listContainer: {
    marginTop: 8,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  seeAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  emptyState: {
    minHeight: 84,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 13,
  },
});
