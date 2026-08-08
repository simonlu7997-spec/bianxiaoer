import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useLanguage } from '../i18n';
import { merchantName, merchantAddress } from '../services/MapService';
import categories from '../data/categories';

const catEmoji = (id) => categories.find((c) => c.id === id)?.emoji || '📍';

// 商户卡片（列表项）
export default function MerchantCard({ merchant, onPress }) {
  const { t, lang } = useLanguage();
  const catKey = categories.find((c) => c.id === merchant.category)?.key;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(merchant)} activeOpacity={0.85}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{catEmoji(merchant.category)}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{merchantName(merchant, lang)}</Text>
          {merchant.featured && (
            <View style={styles.featTag}><Text style={styles.featText}>{t('common.sponsored')}</Text></View>
          )}
        </View>
        {catKey && <Text style={styles.cat}>{t(`categories.${catKey}`)}</Text>}
        <Text style={styles.addr} numberOfLines={1}>{merchantAddress(merchant, lang)}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={13} color={colors.gold} />
          <Text style={styles.rating}>{merchant.rating?.toFixed(1)}</Text>
          {merchant.phone ? (
            <>
              <Ionicons name="call" size={13} color={colors.textLight} style={{ marginLeft: 10 }} />
              <Text style={styles.phone}>{merchant.phone}</Text>
            </>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 24 },
  body: { flex: 1, marginLeft: 12, marginRight: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1 },
  featTag: { backgroundColor: colors.gold, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 6 },
  featText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  cat: { fontSize: 12, color: colors.primary, marginTop: 2 },
  addr: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rating: { fontSize: 13, color: colors.text, fontWeight: '600', marginLeft: 3 },
  phone: { fontSize: 12, color: colors.textLight, marginLeft: 3 },
});
