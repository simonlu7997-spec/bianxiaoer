import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useLanguage } from '../i18n';
import { searchPlaces } from '../services/MapService';
import MerchantCard from '../components/MerchantCard';

// 搜索页 — 支持直接输入地址或商户名称（文档：可直接输入地址或名称，转到商户）
export default function SearchScreen({ navigation, route }) {
  const { t, lang } = useLanguage();
  const [keyword, setKeyword] = useState(route.params?.keyword || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    if (route.params?.keyword) doSearch(route.params.keyword);
  }, []);

  const doSearch = async (kw) => {
    const q = kw.trim();
    if (!q) return;
    setSearching(true);
    setSearched(false);
    const list = await searchPlaces(q, lang);
    setResults(list);
    setSearching(false);
    setSearched(true);
    setRecents((prev) => [q, ...prev.filter((r) => r !== q)].slice(0, 5));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textLight}
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={() => doSearch(keyword)}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity onPress={() => doSearch(keyword)}>
          <Ionicons name="search" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>{t('search.hint')}</Text>

      {!searched && recents.length > 0 && (
        <View style={styles.recentWrap}>
          <View style={styles.recentRow}>
            <Text style={styles.recentTitle}>{t('search.recent')}</Text>
            <TouchableOpacity onPress={() => setRecents([])}>
              <Text style={styles.clear}>{t('search.clear')}</Text>
            </TouchableOpacity>
          </View>
          {recents.map((r) => (
            <TouchableOpacity key={r} onPress={() => { setKeyword(r); doSearch(r); }}>
              <Text style={styles.recentItem}>🕘 {r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {searching && <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />}

      {searched && !searching && (
        <>
          <Text style={styles.resultTitle}>{t('search.results')}（{results.length}）</Text>
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <MerchantCard merchant={item} onPress={() => navigation.navigate('MerchantDetail', { merchantId: item.id, merchant: item })} />}
            ListEmptyComponent={<Text style={styles.empty}>{t('search.noResult')}</Text>}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    height: 46,
  },
  input: { flex: 1, fontSize: 15, color: colors.text, marginHorizontal: 10, padding: 0 },
  hint: { fontSize: 12, color: colors.textLight, marginHorizontal: 20, marginTop: 10 },
  recentWrap: { marginTop: 14, marginHorizontal: 16 },
  recentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  recentTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  clear: { fontSize: 13, color: colors.primary },
  recentItem: { fontSize: 14, color: colors.text, paddingVertical: 6 },
  resultTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginHorizontal: 16, marginVertical: 10 },
  empty: { textAlign: 'center', color: colors.textLight, marginTop: 40 },
});
