import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useLanguage } from '../i18n';
import { fetchMerchants, fetchMerchantById, navLinks, merchantName, merchantAddress } from '../services/MapService';
import categories from '../data/categories';

// 商户详情 — 信息 + 导航跳转（百度/高德/苹果）+ 分享
export default function MerchantDetailScreen({ navigation, route }) {
  const { t, lang } = useLanguage();
  const [merchant, setMerchant] = useState(null);

  useEffect(() => {
    (async () => {
      // 优先使用传入的完整商户对象（如真实 POI 搜索结果）
      if (route.params?.merchant) {
        setMerchant(route.params.merchant);
        return;
      }
      const m = await fetchMerchantById(route.params?.merchantId);
      setMerchant(m || null);
    })();
  }, [route.params?.merchantId]);

  if (!merchant) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.empty}>{t('home.noData')}</Text>
      </SafeAreaView>
    );
  }

  const catKey = categories.find((c) => c.id === merchant.category)?.key;
  const links = navLinks(merchant.lat, merchant.lng, merchantName(merchant, lang));

  const openUrl = async (url) => {
    const ok = await Linking.canOpenURL(url).catch(() => false);
    if (ok) Linking.openURL(url);
    else Alert.alert(t('common.ok'), t('detail.directionHint'));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t('detail.category')}</Text>
        <TouchableOpacity onPress={() => Alert.alert(merchantName(merchant, lang), merchantAddress(merchant, lang))}>
          <Ionicons name="share-social-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>{categories.find((c) => c.id === merchant.category)?.emoji || '📍'}</Text>
          <Text style={styles.name}>{merchantName(merchant, lang)}</Text>
          {catKey && (
            <View style={styles.catTag}><Text style={styles.catText}>{t(`categories.${catKey}`)}</Text></View>
          )}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={15} color={colors.gold} />
            <Text style={styles.rating}>{merchant.rating?.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={styles.infoText}>{merchantAddress(merchant, lang)}</Text>
          </View>
          {merchant.phone ? (
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${merchant.phone}`)}>
              <Ionicons name="call" size={18} color={colors.success} />
              <Text style={styles.infoText}>{merchant.phone}</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={18} color={colors.textLight} />
            <Text style={styles.infoText}>{merchant.desc?.[lang] || merchant.desc?.zh}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('detail.navigate')}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.navRow} onPress={() => openUrl(links.amap)}>
            <View style={[styles.navIcon, { backgroundColor: '#00B9F2' }]}><Text style={styles.navIconText}>高</Text></View>
            <Text style={styles.navLabel}>{t('detail.openAmap')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.navRow} onPress={() => openUrl(links.baidu)}>
            <View style={[styles.navIcon, { backgroundColor: '#3385FF' }]}><Text style={styles.navIconText}>百</Text></View>
            <Text style={styles.navLabel}>{t('detail.openBaidu')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.navRow} onPress={() => openUrl(links.apple)}>
            <View style={[styles.navIcon, { backgroundColor: '#5B5F66' }]}><Ionicons name="car" size={16} color={colors.white} /></View>
            <Text style={styles.navLabel}>{t('detail.openApple')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  hero: { alignItems: 'center', paddingVertical: 22, backgroundColor: colors.primaryLight, marginHorizontal: 16, borderRadius: 16 },
  emoji: { fontSize: 44 },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
  catTag: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 },
  catText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rating: { fontSize: 15, fontWeight: '700', color: colors.text, marginLeft: 4 },
  card: { backgroundColor: colors.card, borderRadius: 14, marginHorizontal: 16, marginTop: 12, padding: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  infoText: { flex: 1, fontSize: 14, color: colors.text, marginLeft: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginHorizontal: 16, marginTop: 18, marginBottom: 6 },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  navIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  navIconText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  navLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600', marginLeft: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  empty: { textAlign: 'center', color: colors.textLight, marginTop: 60 },
});
