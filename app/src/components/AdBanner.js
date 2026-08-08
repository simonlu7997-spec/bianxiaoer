import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import colors from '../theme/colors';
import { useLanguage } from '../i18n';

const W = Dimensions.get('window').width;

// 重点企业广告轮播（可点击 → 商户详情/外链）
export default function AdBanner({ ads, onPressAd }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!ads?.length || ads.length < 2) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % ads.length;
        scrollRef.current?.scrollTo({ x: next * (W - 32), animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(timerRef.current);
  }, [ads]);

  if (!ads?.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('home.adsTitle')}</Text>
        <View style={styles.tag}><Text style={styles.tagText}>{t('common.sponsored')}</Text></View>
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
            <Text style={styles.cardText}>{ad.title.zh}</Text>
            <Text style={styles.cardSub}>{ad.title.en}</Text>
            <Text style={styles.cardSub}>{ad.title.ru}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {ads.map((a, i) => (
          <View key={a.id} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginTop: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  tag: { backgroundColor: colors.gold, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 8 },
  tagText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  scroll: { borderRadius: 14 },
  card: {
    width: W - 32,
    height: 108,
    borderRadius: 14,
    padding: 16,
    justifyContent: 'center',
    marginRight: 12,
  },
  cardText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  cardSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border, marginHorizontal: 3 },
  dotActive: { backgroundColor: colors.primary, width: 16 },
});
