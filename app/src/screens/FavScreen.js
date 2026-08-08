import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useLanguage } from '../i18n';
import MerchantCard from '../components/MerchantCard';

// 收藏页（本地存储，预留后端同步）
export default function FavScreen({ navigation, route }) {
  const { t } = useLanguage();
  const favs = route.params?.favs || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t('profile.favorites')}</Text>
        <View style={{ width: 22 }} />
      </View>

      {favs.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="heart-outline" size={48} color={colors.border} />
          <Text style={styles.empty}>{t('home.noData')}</Text>
        </View>
      ) : (
        <FlatList
          data={favs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <MerchantCard merchant={item} onPress={() => navigation.navigate('MerchantDetail', { merchantId: item.id })} />
          )}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 30 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.textLight, marginTop: 10 },
});
