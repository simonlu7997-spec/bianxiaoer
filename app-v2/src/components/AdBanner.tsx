import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import colors from "@/src/theme/colors";
import { useLanguage } from "@/src/i18n";
import type { Ad } from "@/src/data/ads";

const W = Dimensions.get("window").width;

// 重点企业广告轮播（可点击 → 商户详情/外链）（v1 保留组件）
export default function AdBanner({
  ads,
  onPressAd,
}: {
  ads: Ad[];
  onPressAd?: (ad: Ad) => void;
}) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!ads?.length || ads.length < 2) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % ads.length;
        scrollRef.current?.scrollTo({ x: next * (W - 32), animated: true });
        return next;
      });
    }, 3500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ads]);

  if (!ads?.length) return null;

  const title = (ad: Ad) => ad.title?.zh || "";

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t("home.adsTitle")}</Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{t("common.sponsored")}</Text>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (W - 32)))}
        style={styles.scroll}
      >
        {ads.map((ad) => (
          <TouchableOpacity
            key={ad.id}
            style={[styles.card, { backgroundColor: ad.bg }]}
            activeOpacity={0.9}
            onPress={() => onPressAd?.(ad)}
          >
            <Text style={styles.cardText}>{title(ad)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: { fontSize: 17, fontWeight: "700", color: colors.text },
  tag: {
    marginLeft: 8,
    backgroundColor: colors.gold,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tagText: { color: colors.white, fontSize: 10, fontWeight: "700" },
  scroll: { flexGrow: 0 },
  card: {
    width: W - 32,
    marginLeft: 16,
    borderRadius: 14,
    paddingVertical: 26,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  cardText: { color: colors.white, fontSize: 16, fontWeight: "800" },
});
