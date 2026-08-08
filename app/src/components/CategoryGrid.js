import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import categories from '../data/categories';
import { useLanguage } from '../i18n';

// 六大生活服务分类宫格（支付宝风格图标格）
export default function CategoryGrid({ onSelect }) {
  const { t } = useLanguage();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('home.categoriesTitle')}</Text>
      <View style={styles.grid}>
        {categories.map((c) => (
          <TouchableOpacity key={c.id} style={styles.item} onPress={() => onSelect?.(c)} activeOpacity={0.7}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{c.emoji}</Text>
            </View>
            <Text style={styles.label}>{t(`categories.${c.key}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12, paddingHorizontal: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  item: { width: '33.33%', alignItems: 'center', marginBottom: 14 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 26 },
  label: { fontSize: 13, color: colors.text, marginTop: 6 },
});
