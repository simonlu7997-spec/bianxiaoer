import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from "react-native-maps";
import config from "@/src/config";
import colors from "@/src/theme/colors";
import AmapWebMap, { type MapHandle } from "./AmapWebMap";
import type { Merchant } from "@/src/data/merchants";

export type { MapHandle };

// ─────────────────────────────────────────────────────────────
// 地图组件 — 平台分流（v1 保留功能）：
//   iOS     → react-native-maps + 高德瓦片 UrlTile（原生体验）
//   Android → AmapWebMap（WebView + Leaflet + 高德瓦片，无 GMS 依赖）
// 两者 props / ref 接口一致：
//   - center：城市中心点（切换城市时动画平移）
//   - selectedId：选中的商户 id（金色放大图钉）
//   - onMarkerPress(merchant)：点图钉回调（null = 点空白取消选中）
//   - 暴露 ref.animateToCenter(center?)：回到业务中心
// ─────────────────────────────────────────────────────────────

interface MerchantMapProps {
  merchants: Merchant[];
  onMarkerPress?: (m: Merchant | null) => void;
  selectedId?: string | null;
  center?: { latitude: number; longitude: number } | null;
  userLocation?: { latitude: number; longitude: number } | null;
}

// iOS 原生地图（react-native-maps + 高德瓦片，中国区可用，无 Google 数据依赖）
const IosMerchantMap = forwardRef<MapHandle, MerchantMapProps>(function IosMerchantMap(
  { merchants, onMarkerPress, selectedId, center, userLocation },
  ref
) {
  const mapRef = useRef<MapView>(null);
  const initial = center || config.DEFAULT_CENTER;

  useEffect(() => {
    if (center && mapRef.current) {
      mapRef.current.animateToRegion(
        { ...center, latitudeDelta: 0.06, longitudeDelta: 0.06 },
        600
      );
    }
  }, [center?.latitude, center?.longitude]);

  useImperativeHandle(ref, () => ({
    animateToCenter: (c?: { latitude: number; longitude: number }) => {
      const target = c || config.DEFAULT_CENTER;
      mapRef.current?.animateToRegion({ ...target, latitudeDelta: 0.06, longitudeDelta: 0.06 }, 600);
    },
  }));

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={{
        latitude: initial.latitude,
        longitude: initial.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }}
      showsUserLocation={!!userLocation}
      showsMyLocationButton
      mapType="standard"
    >
      {/* SDK 54 (react-native-maps 1.20) UrlTile 不支持 subdomains，固定子域 01 */}
      <UrlTile
        urlTemplate={config.AMAP_TILE_URL}
        maximumZ={19}
        tileSize={256}
        shouldReplaceMapContent={false}
      />

      {(merchants || []).map((m) => {
        const selected = m.id === selectedId;
        return (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            onPress={() => onMarkerPress?.(m)}
            tracksViewChanges={false}
          >
            <View style={styles.pinWrap}>
              <View
                style={[
                  styles.pin,
                  m.featured && styles.pinGold,
                  selected && styles.pinSelected,
                ]}
              >
                <View style={styles.pinDot} />
              </View>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
});

// 平台分流
const MerchantMap = forwardRef<MapHandle, MerchantMapProps>(function MerchantMap(props, ref) {
  if (Platform.OS === "android") {
    return <AmapWebMap ref={ref} {...props} />;
  }
  return <IosMerchantMap ref={ref} {...props} />;
});

const styles = StyleSheet.create({
  map: { flex: 1 },
  pinWrap: { alignItems: "center", justifyContent: "center" },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinGold: { backgroundColor: colors.gold },
  pinSelected: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
  },
  pinDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
});

export default MerchantMap;
