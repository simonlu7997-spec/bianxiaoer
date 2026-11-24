/**
 * 口岸通（边小二）首页 —— 整站容器，承载 https://bianxiaoer.net
 *
 * 2026-11-24：产品以 H5 为唯一形态（小二哥对话、详情页、三语），
 * 原 v2 原生首页对应旧后端，改为直接承载新站；原页面代码保留在 git 历史中。
 *
 * 只允许 bianxiaoer.net 在应用内打开；外链交给系统浏览器。
 */
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView, type WebViewNavigation } from "react-native-webview";

const APP_URL = "https://bianxiaoer.net/";
const ALLOWED_HOSTS = ["bianxiaoer.net", "www.bianxiaoer.net"];

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setReloadKey((value) => value + 1);
  }, []);

  const onShouldStartLoadWithRequest = useCallback((request: WebViewNavigation) => {
    const url = request.url ?? "";
    // 不用 new URL()：Hermes 的 URL 实现不完整，字符串判断更稳。
    if (url.startsWith("about:") || url.startsWith("data:")) return true;
    if (url.indexOf("://bianxiaoer.net") >= 0 || url.indexOf("://www.bianxiaoer.net") >= 0) return true;
    void Linking.openURL(url);
    return false;
  }, []);

  if (error !== null) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.title}>暂时无法打开口岸通</Text>
        <Text style={styles.message}>{error}</Text>
        <Pressable style={styles.button} onPress={retry}>
          <Text style={styles.buttonText}>重试</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <WebView
        key={reloadKey}
        source={{ uri: APP_URL }}
        originWhitelist={["https://*", "http://*"]}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(event) => {
          setLoading(false);
          setError(event.nativeEvent.description || "网络连接失败");
        }}
        allowsBackForwardNavigationGestures
        geolocationEnabled
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
      {loading ? (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>正在加载口岸通…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#111827" },
  message: { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 24 },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#1A6FB5",
  },
  buttonText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    gap: 12,
  },
  loadingText: { fontSize: 13, color: "#6b7280" },
});
