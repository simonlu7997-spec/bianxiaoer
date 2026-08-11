# Codex 交接文档 — 边小二 v2.0.0 iOS 启动闪退调试

> 更新: 2026-08-09 09:30 (Asia/Shanghai) | 项目: `/Users/luhao/.openclaw/workspace/projects/bian-xiao-er/app-v2/`

## 1. 当前状态一句话

**App 在 iPhone 16 (iOS 26.6) 上启动即闪退**，崩溃点是 RN TurboModule 的 `ObjCTurboModule::performVoidMethodInvocation` (SIGABRT/NSException)。已升级到 **Expo SDK 56 (RN 0.85.3)** 仍然崩溃，说明不是 RN 版本问题，而是**某个 TurboModule 在 iOS 26.6 上真实抛出 NSException**，需要定位具体模块。

## 2. 环境

- 设备: iPhone 16, UDID `B38E7EB0-3989-535C-B423-A5DEE164BFD1`, iOS 26.6
- 架构: Expo SDK 56, RN 0.85.3, React 19.2.3, expo-router ~56.2.9, New Architecture (TurboModules)
- 构建机: macOS (Xcode 26.6), 磁盘紧张 (~1.8Gi 空闲，需要清理 DerivedData)
- 代码来源: GitHub `manus/latest-code-20260808` 分支（main 被回滚过，这个分支有完整代码）

## 3. 崩溃证据

- 崩溃签名: `SIGABRT` in `ObjCTurboModule::performVoidMethodInvocation`（async void 分支，@catch 里 rethrow NSException → abort）
- 这是 RN 已知 issue #54859 家族（RN 0.81 + iOS 26 兼容问题），但升级到 0.85.3 未解决 → 指向具体模块异常
- SDK 56 Release 构建成功 (`BUILD SUCCEEDED`)，真机安装后**立即闪退**，非构建问题

## 4. 已尝试且无效的方案（不要再重复）

1. RN 0.81.6 升级 — 无效
2. 移除 expo-secure-store → 换 AsyncStorage (`lib/_core/auth.ts`) — 无效
3. 注释 `Appearance.setColorScheme` (`lib/theme-provider.tsx`) — 无效
   - ⚠️ 注意: 那次测试实际是**白做的**——当时 pod 用 prebuilt xcframework，源码修改根本没编译进去

## 5. 🔑 关键机制陷阱（必须先知道）

- **RN 0.81+/SDK 54+ 的 React-Core 默认使用 prebuilt xcframework**（`RCT_USE_PREBUILT_RNCORE=1` / `RCT_USE_RN_DEP=1`）
- **修改 `node_modules/react-native/ReactCommon/.../RCTTurboModule.mm` 后必须让源码编译生效**，否则改动无效
- 验证方法: `cd ios && pod install 2>&1 | grep "Building from source"` → 必须为 `true`
- 强制源码编译: `ios/Podfile.properties.json` 设置 `"ios.buildReactNativeFromSource": "true"`
- ⚠️ SDK 54 强制源码编译会撞上 **fmt 库在 Xcode 26.6 的 consteval 编译错误**（这是 RN 默认 prebuilt 的原因）
  - SDK 56 的 fmt 版本是否已修复需重新验证

## 6. 推荐下一步（按优先级）

### 方案 A: 源码补丁定位肇事模块（推荐）
1. 磁盘清理: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
2. `ios/Podfile.properties.json` 设 `buildReactNativeFromSource=true` → `pod install`（验证 fmt 是否还报错）
3. 在 `RCTTurboModule.mm` 的 `performVoidMethodInvocation` @catch 块加日志:
   - 打印 `moduleName`、`methodName`、`exception.reason`、`exception.name`
   - 临时**吞掉异常不 rethrow**（让 App 能启动，看日志定位肇事模块）
4. 装真机 → 看 console 日志 → 定位后针对性修复（升级该库/替换实现）

### 方案 B: 启动期模块逐个隔离
在 `app/_layout.tsx` 逐个注释可疑启动期 TurboModule 调用，每次真机验证:
1. `SplashScreen.preventAutoHideAsync()`
2. `Appearance.setColorScheme`
3. AsyncStorage/SecureStore 调用
4. expo-router 内置模块 (Slot/navigation)

## 7. 项目重要文件

| 文件 | 说明 |
|------|------|
| `lib/trpc.ts` | 本地数据适配层（mock/local storage，无 MySQL 依赖） |
| `lib/_core/auth.ts` | 已改用 AsyncStorage |
| `lib/theme-provider.tsx` | Appearance.setColorScheme 已注释 |
| `app/_layout.tsx` | 根布局，启动期模块隔离的修改点 |
| `src/components/AmapWebMap.tsx` / `MerchantMap.tsx` | v1 地图功能（高德 WebView） |
| `app/(tabs)/index.tsx` 等 | GitHub 迁移的 5-tab UI 结构 |

## 8. 构建/安装命令

```bash
# 构建 Release (真机)
cd /Users/luhao/.openclaw/workspace/projects/bian-xiao-er/app-v2/ios
LANG=en_US.UTF-8 xcodebuild -workspace app.xcworkspace -scheme app \
  -configuration Release -destination 'generic/platform=iOS' \
  DEVELOPMENT_TEAM=754H3T99SY CODE_SIGN_STYLE=Automatic build

# 安装真机
xcrun devicectl device install app \
  --device B38E7EB0-3989-535C-B423-A5DEE164BFD1 <path_to_app.app>

# 启动+查进程
xcrun devicectl device process launch --terminate-existing \
  --device B38E7EB0-3989-535C-B423-A5DEE164BFD1 space.manus.bianxiaoer.app.t20260605

# 崩溃日志
xcrun devicectl device info files --device <UDID> --domain-type systemCrashLogs
```

## 9. 已知 SDK 56 迁移项（已完成，仅供参考）

- `_layout.tsx`: ThemeProvider 从 `expo-router` 导入
- `haptic-tab.tsx`: PlatformPressable 从 `expo-router/react-navigation` 导入，BottomTabBarButtonProps 从 `expo-router/tabs`
- `app.config.ts`: 类型断言处理 edgeToEdgeEnabled/newArchEnabled
- `icon-symbol.tsx`: SymbolViewProps 类型 → 跨平台联合类型，改用 string
- `theme-provider.tsx`: ColorSchemeName cast (unspecified 已移除)
- tsc 已通过，SDK 56 构建成功
