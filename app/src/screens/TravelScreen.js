import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useLanguage } from '../i18n';
import { useUserLocation, effectiveCenter } from '../context/UserLocationContext';
import { navLinks } from '../services/MapService';

// 出行页 — 文档："链接百度、高德等知名导航" + 跨境物流入口
export default function TravelScreen() {
  const { t, tr } = useLanguage();
  const { location } = useUserLocation();
  const center = effectiveCenter(location);

  const open = async (url) => {
    const ok = await Linking.canOpenURL(url).catch(() => false);
    if (ok) Linking.openURL(url);
    else Linking.openURL(url.replace(/^[a-z]+:\/\//, 'https://')); // 无 APP 时退化为网页
  };

  const links = [
    { key: 'amap', icon: 'map', label: t('travel.toAmap'), url: navLinks(center.latitude, center.longitude, 'current').amap, color: '#00B9F2' },
    { key: 'baidu', icon: 'navigate', label: t('travel.toBaidu'), url: navLinks(center.latitude, center.longitude, 'current').baidu, color: '#3385FF' },
    { key: 'apple', icon: 'car', label: t('travel.toApple'), url: navLinks(center.latitude, center.longitude, 'current').apple, color: '#5B5F66' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={styles.title}>{t('travel.title')}</Text>
        <Text style={styles.subtitle}>{t('travel.subtitle')}</Text>

        <View style={styles.card}>
          {links.map((l, i) => (
            <TouchableOpacity key={l.key} style={[styles.linkRow, i < links.length - 1 && styles.divider]} onPress={() => open(l.url)} activeOpacity={0.7}>
              <View style={[styles.linkIcon, { backgroundColor: l.color }]}>
                <Ionicons name={l.icon} size={18} color={colors.white} />
              </View>
              <Text style={styles.linkLabel}>{l.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.logisticsCard}>
          <View style={styles.logoRow}>
            <Text style={styles.logoEmoji}>🚛</Text>
            <View>
              <Text style={styles.logisticsTitle}>{t('travel.logisticsTitle')}</Text>
              <Text style={styles.logisticsDesc}>{t('travel.logisticsDesc')}</Text>
            </View>
          </View>
          {(tr('travel.logisticsList') || []).map((item, i) => (
            <Text key={i} style={styles.logisticsItem}>• {item}</Text>
          ))}
          <TouchableOpacity style={styles.cta} onPress={() => Linking.openURL('tel:0999-8790003')}>
            <Ionicons name="call" size={16} color={colors.white} />
            <Text style={styles.ctaText}>{t('travel.logisticsCta')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginHorizontal: 16, marginTop: 12 },
  subtitle: { fontSize: 13, color: colors.textLight, marginHorizontal: 16, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 14, marginHorizontal: 16, marginTop: 16, paddingHorizontal: 14 },
  linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  linkIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600', marginLeft: 12 },
  logisticsCard: { backgroundColor: colors.card, borderRadius: 14, marginHorizontal: 16, marginTop: 16, padding: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  logoEmoji: { fontSize: 30, marginRight: 10 },
  logisticsTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  logisticsDesc: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  logisticsItem: { fontSize: 14, color: colors.text, paddingVertical: 3 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 11,
    marginTop: 12,
  },
  ctaText: { color: colors.white, fontWeight: '700', marginLeft: 6 },
});
