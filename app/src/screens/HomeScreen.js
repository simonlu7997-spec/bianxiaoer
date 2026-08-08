import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useLanguage } from '../i18n';
import { useUserLocation } from '../context/UserLocationContext';
import { fetchMerchants, fetchAds } from '../services/MapService';
import Header from '../components/Header';
import AdBanner from '../components/AdBanner';
import CategoryGrid from '../components/CategoryGrid';
import MerchantCard from '../components/MerchantCard';

export default function HomeScreen({ navigation }) {
  const { t } = useLanguage();
  const { location } = useUserLocation();
  const [merchants, setMerchants] = useState([]);
  const [adsList, setAdsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    (async () => {
      const [list, adList] = await Promise.all([fetchMerchants(activeCategory), fetchAds()]);
      setMerchants(list);
      setAdsList(adList);
      setLoading(false);
    })();
  }, [activeCategory]);

  const filtered = useMemo(
    () => (activeCategory === 'all' ? merchants : merchants.filter((m) => m.category === activeCategory)),
    [merchants, activeCategory]
  );

  // goDetail 同时接受商户对象或 id 字符串（广告点击传的是 ad.merchantId）
  const goDetail = (m) => navigation.navigate('MerchantDetail', { merchantId: typeof m === 'string' ? m : m?.id });
  const goSearch = (kw) => navigation.navigate('Search', kw ? { keyword: kw } : undefined);

  const onSelectCategory = (c) => {
    setActiveCategory(c.id);
    // 选分类后进全屏地图探索页
    navigation.navigate('Map', { category: c.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header onSearchPress={() => goSearch()} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <AdBanner ads={adsList} onPressAd={(ad) => ad?.merchantId && goDetail(ad.merchantId)} />
            <CategoryGrid onSelect={onSelectCategory} />
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>
                {activeCategory === 'all' ? t('home.nearby') : t(`categories.${activeCategory}`)}
              </Text>
              <TouchableOpacity style={styles.mapEntry} onPress={() => navigation.navigate('Map', {})}>
                <Ionicons name="map" size={15} color={colors.primary} />
                <Text style={styles.mapEntryText}>{t('home.mapExplore')}</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => <MerchantCard merchant={item} onPress={goDetail} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : (
            <Text style={styles.empty}>{t('home.noData')}</Text>
          )
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  mapEntry: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapEntryText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textLight, marginTop: 40 },
});
