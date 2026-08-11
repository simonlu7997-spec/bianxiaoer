// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "边小二",
  appSlug: "bianxiaoer-app",
  // S3 URL of the app logo - set this to the URL returned by generate_image when creating custom logo
  logoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663279243720/Z9fVifYUWvcMCcFBxjciRp/bianxiaoer-icon-aV5e9A5DP43tBY8yPrmR7o.png",
  scheme: "bianxiaoer",
  iosBundleId: "space.manus.bianxiaoer.app.t20260605",
  androidPackage: "com.bianxiaoer.app",
};

const config: ExpoConfig & {
  android: { edgeToEdgeEnabled?: boolean; predictiveBackGestureEnabled?: boolean };
  newArchEnabled?: boolean;
} = {
  name: env.appName,
  slug: env.appSlug,
  version: "2.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    buildNumber: "2",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        "边小二需要使用您的位置来查找附近的商户和导航",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "边小二需要使用您的位置来查找附近的商户和导航",
    },
  },
  android: {
    versionCode: 2,
    adaptiveIcon: {
      backgroundColor: "#1A6FB5",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: "pan",
    package: env.androidPackage,
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "POST_NOTIFICATIONS",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-audio",
      {
        microphonePermission:
          "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#E8F0FE",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
    ["expo-font"],
    ["expo-location"],
    ["expo-camera"],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
