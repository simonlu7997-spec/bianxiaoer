import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useLanguage } from '../i18n';
import { LANGS } from '../i18n/translations';

// 顶部：问候语 + 三语切换 + 搜索入口
export default function Header({ onSearchPress }) {
  const { t, lang, setLang } = useLanguage();
  const [search, setSearch] = useState('');
  const cycleRef = useRef(0);

  const cycleLang = () => {
    cycleRef.current = (cycleRef.current + 1) % LANGS.length;
    setLang(LANGS[cycleRef.current].code);
  };

  const submit = () => {
    if (search.trim()) onSearchPress?.(search.trim());
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.greeting}>{t('home.greeting')} 👋</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        </View>
        <TouchableOpacity style={styles.langBtn} onPress={cycleLang} activeOpacity={0.7}>
          <Ionicons name="language" size={16} color={colors.white} />
          <Text style={styles.langText}>{lang.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.searchBar} onPress={onSearchPress} activeOpacity={0.85}>
        <Ionicons name="search" size={18} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={submit}
          returnKeyType="search"
          editable
        />
        <Ionicons name="navigate" size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: colors.white, fontSize: 20, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langText: { color: colors.white, fontWeight: '700', fontSize: 13, marginLeft: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
    marginTop: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, marginLeft: 8, marginRight: 8, padding: 0 },
});
