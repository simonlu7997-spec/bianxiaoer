import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useLanguage } from '../i18n';
import HomeScreen from '../screens/HomeScreen';
import TravelScreen from '../screens/TravelScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// 底部导航：首页 / 出行 / 我的（文档："回顶部/车/我的"）
export default function TabNavigation() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Travel: focused ? 'car' : 'car-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tabs.home'), title: t('tabs.home') }} />
      <Tab.Screen name="Travel" component={TravelScreen} options={{ tabBarLabel: t('tabs.travel'), title: t('tabs.travel') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('tabs.profile'), title: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}
