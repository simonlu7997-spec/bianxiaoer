import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, Pressable } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";

// Custom center deals tab button
function DealsTabButton({ onPress, accessibilityState }: { onPress?: () => void; accessibilityState?: { selected?: boolean } }) {
  const colors = useColors();
  const isSelected = accessibilityState?.selected;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -16,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: isSelected ? "#FF6B35" : colors.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <IconSymbol name="tag.fill" size={26} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          // 首页是口岸通整站容器，隐藏底部 Tab 让站点全屏呈现。
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="video"
        options={{
          title: t.tabs.video,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="play.rectangle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: t.tabs.deals,
          tabBarButton: (props) => (
            <DealsTabButton
              onPress={props.onPress as () => void}
              accessibilityState={props.accessibilityState}
            />
          ),
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="tag.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t.tabs.cart,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="cart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
