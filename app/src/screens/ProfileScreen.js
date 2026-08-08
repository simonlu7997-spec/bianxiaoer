import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../theme/colors';
import { useLanguage } from '../i18n';
import { LANGS } from '../i18n/translations';

const USER_KEY = '@bianxiaoer/user';

// 我的 — 本地模拟注册/登录（预留后端对接：api.register / api.adminLogin）
export default function ProfileScreen({ navigation }) {
  const { t, lang, setLang } = useLanguage();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(USER_KEY);
      if (raw) setUser(JSON.parse(raw));
    })();
  }, []);

  const save = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert(t('common.ok'), t('profile.inputName'));
      return;
    }
    const u = { name: name.trim(), phone: phone.trim(), lang };
    setUser(u);
    setEditing(false);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    Alert.alert(t('common.ok'), t('profile.saved'));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(USER_KEY);
  };

  const cycleLang = () => {
    const idx = LANGS.findIndex((l) => l.code === lang);
    setLang(LANGS[(idx + 1) % LANGS.length].code);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* 头像卡片 */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          {user ? (
            <>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userPhone}>{user.phone}</Text>
            </>
          ) : (
            <>
              <Text style={styles.userName}>{t('profile.notLoggedIn')}</Text>
              <Text style={styles.userPhone}>{t('profile.loginHint')}</Text>
            </>
          )}
        </View>

        {/* 编辑资料 */}
        {editing ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('profile.register')}</Text>
            <TextInput style={styles.input} placeholder={t('profile.inputName')} value={name} onChangeText={setName} placeholderTextColor={colors.textLight} />
            <TextInput style={styles.input} placeholder={t('profile.inputPhone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={colors.textLight} />
            <TouchableOpacity style={styles.primaryBtn} onPress={save}>
              <Text style={styles.primaryBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => setEditing(false)}>
              <Text style={styles.ghostBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => { setName(user?.name || ''); setPhone(user?.phone || ''); setEditing(true); }}>
              <Ionicons name="person-add" size={20} color={colors.primary} />
              <Text style={styles.rowLabel}>{user ? t('profile.register') : t('profile.login')} / {t('profile.register')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Fav')}>
              <Ionicons name="heart" size={20} color={colors.danger} />
              <Text style={styles.rowLabel}>{t('profile.favorites')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={cycleLang}>
              <Ionicons name="language" size={20} color={colors.success} />
              <Text style={styles.rowLabel}>{t('profile.language')}</Text>
              <Text style={styles.rowValue}>{t('profile.languageLabel')}</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Ionicons name="information-circle" size={20} color={colors.textLight} />
              <Text style={styles.rowLabel}>{t('profile.about')}</Text>
              <Text style={styles.rowValue}>{t('profile.version')}</Text>
            </View>
          </View>
        )}

        {user && (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.primary,
    paddingVertical: 26,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  userName: { color: colors.white, fontSize: 19, fontWeight: '800', marginTop: 10 },
  userPhone: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 3 },
  card: { backgroundColor: colors.card, borderRadius: 14, marginHorizontal: 16, marginTop: 16, paddingHorizontal: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowLabel: { flex: 1, fontSize: 15, color: colors.text, marginLeft: 12 },
  rowValue: { fontSize: 13, color: colors.textLight },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    color: colors.text,
    marginBottom: 10,
  },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 22, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
  ghostBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 2 },
  ghostBtnText: { color: colors.textLight, fontSize: 14 },
  logoutBtn: { backgroundColor: colors.card, borderRadius: 14, marginHorizontal: 16, marginTop: 16, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: colors.danger, fontWeight: '700' },
});
