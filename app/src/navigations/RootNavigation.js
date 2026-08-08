import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import colors from '../theme/colors';
import TabNavigation from './TabNavigation';
import SearchScreen from '../screens/SearchScreen';
import MerchantDetailScreen from '../screens/MerchantDetailScreen';
import FavScreen from '../screens/FavScreen';
import MapScreen from '../screens/MapScreen';

const Stack = createNativeStackNavigator();

// 深链配置：支持分享链接直达页面（bianxiaoer://map?city=kashgar 等）
export const linking = {
  prefixes: ['bianxiaoer://', 'exp://127.0.0.1:8081/--/'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Travel: 'travel',
          Profile: 'profile',
        },
      },
      Map: 'map',
      Search: 'search',
      MerchantDetail: 'merchant/:merchantId',
      Fav: 'favorites',
    },
  },
};

// 根导航：Tab + 二级页面（搜索 / 地图探索 / 商户详情 / 收藏）
export default function RootNavigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="Main" component={TabNavigation} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Fav" component={FavScreen} options={{ animation: 'slide_from_right' }} />
      </Stack.Navigator>
  );
}
