import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import config from "@/src/config";
import type { Merchant } from "@/src/data/merchants";

// ─────────────────────────────────────────────────────────────
// Web 地图 — Leaflet + 高德栅格瓦片（与 Android AmapWebMap 同源，样式一致）
// 仅用于 Platform.OS === "web"（bianxiaoer.pect-dapp.io 网页版）
// 与 iOS MerchantMap 保持相同 props + ref.animateToCenter 接口
// ─────────────────────────────────────────────────────────────
export interface MapHandle {
  animateToCenter: (c?: { latitude: number; longitude: number }) => void;
}

interface WebLeafletMapProps {
  merchants: Merchant[];
  onMarkerPress?: (m: Merchant | null) => void;
  selectedId?: string | null;
  center?: { latitude: number; longitude: number } | null;
  userLocation?: { latitude: number; longitude: number } | null;
}

// 图钉 / 用户蓝点全局样式（与 Android WebView 版一致；运行时注入一次）
const MAP_CSS = `
.bxe-pin-wrap { display:flex; align-items:center; justify-content:center; }
.bxe-pin {
  width:20px; height:20px; border-radius:50%;
  background:#2E6BE6; border:2.5px solid #fff;
  box-shadow:0 2px 4px rgba(0,0,0,.25);
  display:flex; align-items:center; justify-content:center;
  box-sizing:border-box;
}
.bxe-pin-gold { background:#F5B301; }
.bxe-pin-selected { width:30px; height:30px; border-width:3px; }
.bxe-pin-dot { width:6px; height:6px; border-radius:50%; background:#fff; }
.bxe-pin-selected .bxe-pin-dot { width:8px; height:8px; }
.bxe-user-dot {
  width:14px; height:14px; border-radius:50%;
  background:#2E6BE6; border:3px solid #fff;
  box-shadow:0 0 0 3px rgba(46,107,230,.22);
  box-sizing:border-box;
}
`;

interface Bridge {
  setMerchants: (list: Merchant[]) => void;
  setSelected: (id: string | null) => void;
  setCenter: (lat: number, lng: number, zoom?: number) => void;
  setUserLocation: (lat: number, lng: number) => void;
}

const WebLeafletMap = forwardRef<MapHandle, WebLeafletMapProps>(function WebLeafletMap(
  { merchants, onMarkerPress, selectedId, center, userLocation },
  ref
) {
  const containerRef = useRef<View>(null);
  const mapRef = useRef<L.Map | null>(null);
  const bridgeRef = useRef<Bridge | null>(null);
  const stateRef = useRef({ merchants, selectedId, center, userLocation });
  stateRef.current = { merchants, selectedId, center, userLocation };

  // 运行时注入图钉样式（避免 CSS 打包依赖）
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.id = "bxe-webmap-styles";
    styleEl.textContent = MAP_CSS;
    document.head.appendChild(styleEl);
    return () => {
      document.getElementById("bxe-webmap-styles")?.remove();
    };
  }, []);

  // 初始化地图（仅一次）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 19,
    });
    L.tileLayer(config.AMAP_TILE_URL, {
      subdomains: config.AMAP_SUBDOMAINS,
      maxZoom: 19,
      tileSize: 256,
    }).addTo(map);
    map.setView([config.DEFAULT_CENTER.latitude, config.DEFAULT_CENTER.longitude], 13);

    const markers: Record<string, L.Marker> = {};
    const store: Record<string, { featured: boolean }> = {};
    let selected: string | null = null;
    let userMarker: L.Marker | null = null;

    const iconFor = (id: string) => {
      const d = store[id] || { featured: false };
      const sel = id === selected;
      const cls = "bxe-pin" + (d.featured ? " bxe-pin-gold" : "") + (sel ? " bxe-pin-selected" : "");
      const size = sel ? 30 : 20;
      return L.divIcon({
        className: "",
        html: `<div class="bxe-pin-wrap"><div class="${cls}"><div class="bxe-pin-dot"></div></div></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    };

    const setMerchants = (list: Merchant[]) => {
      const ids: Record<string, boolean> = {};
      (list || []).forEach((m) => {
        if (m.lat == null || m.lng == null) return;
        ids[m.id] = true;
        store[m.id] = { featured: !!m.featured };
        if (markers[m.id]) {
          markers[m.id].setLatLng([m.lat, m.lng]);
          markers[m.id].setIcon(iconFor(m.id));
        } else {
          const mk = L.marker([m.lat, m.lng], { icon: iconFor(m.id) }).addTo(map);
          mk.on("click", () => stateRef.current.onMarkerPress?.(m));
          markers[m.id] = mk;
        }
      });
      Object.keys(markers).forEach((id) => {
        if (!ids[id]) {
          map.removeLayer(markers[id]);
          delete markers[id];
          delete store[id];
        }
      });
    };

    const setSelected = (id: string | null) => {
      selected = id || null;
      Object.keys(markers).forEach((k) => markers[k].setIcon(iconFor(k)));
    };

    const setUserLocation = (lat: number, lng: number) => {
      if (lat == null || lng == null) {
        if (userMarker) {
          map.removeLayer(userMarker);
          userMarker = null;
        }
        return;
      }
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        userMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: "",
            html: '<div class="bxe-user-dot"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
          interactive: false,
          zIndexOffset: 1000,
        }).addTo(map);
      }
    };

    const setCenter = (lat: number, lng: number, zoom?: number) => {
      map.flyTo([lat, lng], zoom || map.getZoom(), { duration: 0.6 });
    };

    map.on("click", () => stateRef.current.onMarkerPress?.(null));

    bridgeRef.current = { setMerchants, setSelected, setCenter, setUserLocation };
    mapRef.current = map;

    // 初始全量推送
    const s = stateRef.current;
    setMerchants(s.merchants || []);
    setSelected(s.selectedId || null);
    if (s.center) setCenter(s.center.latitude, s.center.longitude, 13);
    if (s.userLocation) setUserLocation(s.userLocation.latitude, s.userLocation.longitude);

    return () => {
      map.remove();
      mapRef.current = null;
      bridgeRef.current = null;
    };
  }, []);

  // props 增量更新
  useEffect(() => {
    if (bridgeRef.current) bridgeRef.current.setMerchants(merchants || []);
  }, [merchants]);
  useEffect(() => {
    if (bridgeRef.current) bridgeRef.current.setSelected(selectedId || null);
  }, [selectedId]);
  useEffect(() => {
    if (bridgeRef.current && center) {
      bridgeRef.current.setCenter(center.latitude, center.longitude, 13);
    }
  }, [center?.latitude, center?.longitude]);
  useEffect(() => {
    if (bridgeRef.current && userLocation) {
      bridgeRef.current.setUserLocation(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  useImperativeHandle(ref, () => ({
    animateToCenter: (c?: { latitude: number; longitude: number }) => {
      const target = c || config.DEFAULT_CENTER;
      bridgeRef.current?.setCenter(target.latitude, target.longitude, 13);
    },
  }));

  return <View ref={containerRef} style={styles.map} />;
});

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: "#e9eef5" },
});

export default WebLeafletMap;
