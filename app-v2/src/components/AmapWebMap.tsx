import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import config from "@/src/config";
import type { Merchant } from "@/src/data/merchants";

// ─────────────────────────────────────────────────────────────
// Android 地图 — 高德瓦片 WebView 方案（v1 保留功能）
// 背景：react-native-maps 的 Android 实现依赖 Google Play Services，
//       国行无 GMS 设备地图空白 → 改用 WebView + Leaflet（本地内嵌，
//       高德栅格瓦片与 iOS 同源，样式一致；无需 GMS / 无需高德 SDK Key）
// 注意：HTML 不走 Metro require() —— RN 0.86 对 require() 资源生成
//       合成 http URL（如 http://src_mapweb_index/），WebView 无法解析；
//       改用原生 assets 目录 + file:///android_asset/ 加载（构建脚本自动同步）
// 通信：RN → Web：injectJavaScript 调用 window.__bridge.*
//       Web → RN：postMessage（ready / markerPress / mapPress）
// 与 iOS MerchantMap 保持相同 props + ref.animateToCenter 接口
// ─────────────────────────────────────────────────────────────
export interface MapHandle {
  animateToCenter: (c?: { latitude: number; longitude: number }) => void;
}

interface AmapWebMapProps {
  merchants: Merchant[];
  onMarkerPress?: (m: Merchant | null) => void;
  selectedId?: string | null;
  center?: { latitude: number; longitude: number } | null;
  userLocation?: { latitude: number; longitude: number } | null;
}

const AmapWebMap = forwardRef<MapHandle, AmapWebMapProps>(function AmapWebMap(
  { merchants, onMarkerPress, selectedId, center, userLocation },
  ref
) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  // 始终持有最新 props（供 ready 时一次性推全量）
  const stateRef = useRef<AmapWebMapProps>({ merchants, selectedId, center, userLocation });
  stateRef.current = { merchants, selectedId, center, userLocation };

  const inject = (js: string) => webRef.current?.injectJavaScript(js);

  const pushState = () => {
    if (!readyRef.current) return;
    const s = stateRef.current;
    inject(`window.__bridge && window.__bridge.setMerchants(${JSON.stringify(s.merchants || [])});`);
    inject(`window.__bridge && window.__bridge.setSelected(${JSON.stringify(s.selectedId || null)});`);
    if (s.center) {
      inject(`window.__bridge && window.__bridge.setCenter(${s.center.latitude}, ${s.center.longitude}, 13);`);
    }
    if (s.userLocation) {
      inject(`window.__bridge && window.__bridge.setUserLocation(${s.userLocation.latitude}, ${s.userLocation.longitude});`);
    }
  };

  // props 变化 → 增量注入
  useEffect(() => {
    if (readyRef.current) {
      inject(`window.__bridge && window.__bridge.setMerchants(${JSON.stringify(merchants || [])});`);
    }
  }, [merchants]);
  useEffect(() => {
    if (readyRef.current) {
      inject(`window.__bridge && window.__bridge.setSelected(${JSON.stringify(selectedId || null)});`);
    }
  }, [selectedId]);
  useEffect(() => {
    if (readyRef.current && center) {
      inject(`window.__bridge && window.__bridge.setCenter(${center.latitude}, ${center.longitude}, 13);`);
    }
  }, [center?.latitude, center?.longitude]);
  useEffect(() => {
    if (readyRef.current && userLocation) {
      inject(`window.__bridge && window.__bridge.setUserLocation(${userLocation.latitude}, ${userLocation.longitude});`);
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  useImperativeHandle(ref, () => ({
    animateToCenter: (c?: { latitude: number; longitude: number }) => {
      const target = c || config.DEFAULT_CENTER;
      if (readyRef.current) {
        inject(`window.__bridge && window.__bridge.setCenter(${target.latitude}, ${target.longitude}, 13);`);
      }
    },
  }));

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === "ready") {
        readyRef.current = true;
        pushState();
      } else if (data.type === "markerPress") {
        const m = (stateRef.current.merchants || []).find(
          (x) => String(x.id) === String(data.id)
        );
        if (m) onMarkerPress?.(m);
      } else if (data.type === "mapPress") {
        onMarkerPress?.(null);
      }
    } catch (err) {
      // 忽略非 JSON 消息
    }
  };

  return (
    <WebView
      ref={webRef}
      style={styles.map}
      source={{ uri: "file:///android_asset/bianxiaoer-map.html" }}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
      mixedContentMode="never"
      onMessage={onMessage}
    />
  );
});

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: "#e9eef5" },
});

export default AmapWebMap;
