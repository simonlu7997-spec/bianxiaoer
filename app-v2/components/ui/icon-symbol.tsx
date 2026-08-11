// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { type SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

// SDK 56: expo-symbols 的 name 类型为跨平台联合类型，取 ios 分支字符串
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SymbolName = string;
type IconMapping = Record<SymbolName, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for BianXiaoEr app.
 */
const MAPPING = {
  // Navigation / Tab icons
  "house.fill": "home",
  "play.rectangle.fill": "play-circle-filled",
  "tag.fill": "local-offer",
  "cart.fill": "shopping-cart",
  "person.fill": "person",

  // Service category icons
  "bed.double.fill": "hotel",
  "car.fill": "directions-car",
  "fork.knife": "restaurant",
  "bag.fill": "delivery-dining",
  "bag.circle.fill": "shopping-bag",
  "wrench.and.screwdriver.fill": "build",
  "scissors": "content-cut",
  "gamecontroller.fill": "sports-esports",
  "shippingbox.fill": "local-shipping",
  "globe.asia.australia.fill": "public",

  // UI icons
  "location.fill": "location-on",
  "magnifyingglass": "search",
  "qrcode.viewfinder": "qr-code-scanner",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.left.forwardslash.chevron.right": "code",
  "paperplane.fill": "send",
  "star.fill": "star",
  "heart.fill": "favorite",
  "bell.fill": "notifications",
  "gear": "settings",
  "arrow.up.to.line": "vertical-align-top",
  "xmark": "close",
  "plus": "add",
  "minus": "remove",
  "checkmark": "check",
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
  "map.fill": "map",
  "phone.fill": "phone",
  "envelope.fill": "email",
  "camera.fill": "camera-alt",
  "photo.fill": "photo",
  "trash.fill": "delete",
  "pencil": "edit",
  "square.and.arrow.up": "share",
  "arrow.clockwise": "refresh",
  "line.3.horizontal": "menu",
  "ellipsis": "more-horiz",
  "person.crop.circle.fill": "account-circle",
  "star": "star-outline",
  "heart": "favorite-border",
  "clock.fill": "access-time",
  "creditcard.fill": "credit-card",
  "gift.fill": "card-giftcard",
  "shield.fill": "security",
  "questionmark.circle.fill": "help",
  "arrow.right.circle.fill": "arrow-circle-right",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "lock.fill": "lock",
  "person.crop.circle.badge.exclamationmark": "account-circle",
  "storefront.fill": "storefront",
  "tray.fill": "inventory-2",
  "return": "keyboard-return",
  "moon.fill": "dark-mode",
  "sun.max.fill": "light-mode",
  "iphone": "smartphone",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolName;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
