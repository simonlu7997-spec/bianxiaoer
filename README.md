# 边小二 (Bian Xiao Er)

面向中亚游客的本地生活向导 APP — 服务霍尔果斯、喀什等新疆口岸城市。
支持 **中文 / English / Русский** 三语，地图找店、搜索商户、导航跳转、重点企业广告位。

## 当前版本：v2.0.0 ✅

- **iOS**：真机（iPhone 16 / iOS 26.6）安装运行验证通过；模拟器（iPhone 17 Pro / iOS 26.5）验证通过
- **Android**：v4 APK 构建完成（`app-v2/android`，高德 WebView 地图方案）
- 代码目录：**`app-v2/`**（新版，Expo Router 结构）—— 旧版 v1 代码已移除，历史版本见 Git 提交记录与 [GitHub Releases](https://github.com/simonlu7997-spec/bianxiaoer/releases)（v3.0.0 为 v1 代码构建的安装包）

## 核心功能

- **三语界面**：中文 / 英文 / 俄文，可持久化切换
- **首页**：定位城市、搜索、Banner 轮播、六大分类宫格（餐饮/商超/汽修/美容/休闲/跨境物流）、热门推荐 + 附近商家
- **地图**：全屏地图探索（霍尔果斯/喀什切换、分类筛选、自定义图钉）、高德/百度导航跳转、深链 `bianxiaoer://map?city=kashgar`
- **商家详情**：三语名称/地址/电话/评分、导航按钮
- **数据**：本地 mock + 后台管理系统在线配置（`lib/trpc.ts` 适配层，离线可用）

## 技术栈

| 层 | 选型 |
|----|------|
| 框架 | Expo SDK 56 (React Native 0.85.3, React 19, New Architecture) |
| 导航 | Expo Router + React Navigation 7 (bottom-tabs + native-stack) |
| 样式 | NativeWind (Tailwind) |
| 地图 | react-native-maps + 高德栅格瓦片（中国区可用，无需 Google）+ WebView 兜底 |
| 图片 | expo-image；**Banner 等资源打包进 App**（CloudFront 在中国大陆不可达，本地化保证弱网可用） |
| 数据 | @tanstack/react-query + tRPC（本地适配层 `lib/trpc.ts`，mock/localStorage） |
| 三语 | 自研轻量 i18n（`lib/i18n.ts`，zh/en/ru） |

## 项目结构

```
app-v2/
├── app/                        # Expo Router 路由页面（首页/搜索/地图/商家/登录/购物车/视频/我的）
├── components/                 # 通用组件（home/ 下首页模块：Banner/Header/ServiceGrid/MerchantCard）
├── src/
│   ├── components/             # v1 保留组件（AmapWebMap/MerchantMap/AdBanner 等）
│   ├── data/                   # 分类/商户 mock 数据
│   ├── services/               # MapService（POI 搜索 + 导航）
│   └── theme/                  # 伊犁蓝主题
├── assets/
│   ├── banners/                # 首页 Banner 本地图片（压缩打包）
│   └── images/                 # App 图标
├── lib/                        # trpc 适配层 / i18n / theme-provider / 认证
├── shared/                     # 共享类型定义（bixiaoer.ts）
├── server/ + drizzle/          # 开发期 tRPC server + 数据库 schema（预留）
├── hooks/ constants/ types/    # 工具
└── ios/ android/               # 原生工程（Expo prebuild 生成，不入库）
```

## 运行与构建

```bash
cd app-v2
npm install

# 开发
npx expo start                 # 模拟器/Expo Go 调试

# iOS 真机 Release（签名后侧载）
cd ios && LANG=en_US.UTF-8 xcodebuild \
  -workspace app.xcworkspace -scheme app -configuration Release \
  -destination 'generic/platform=iOS' \
  DEVELOPMENT_TEAM=<TeamID> CODE_SIGN_STYLE=Automatic build

# 安装到真机
xcrun devicectl device install app --device <UDID> <path>/app.app
xcrun devicectl device process launch --device <UDID> space.manus.bianxiaoer.app.t20260605
```

> ⚠️ iOS 26.6 真机注意：RN TurboModule 存在 NSException 崩溃问题（issue #54859 类）。
> 本项目已通过 **React Native 源码编译模式**（`ios/Podfile.properties.json` 设
> `buildReactNativeFromSource=true`，重新 `pod install`）+ RCTTurboModule.mm @catch 补丁修复。
> 修改 node_modules 原生源码后必须源码编译才生效（prebuilt xcframework 不会包含补丁）。

## 后台管理系统（已上线 ✅）

生产环境：https://admin.pect-dapp.io（源码见 `admin/` 目录）

| 模块 | 说明 |
|------|------|
| 管理员登录 | 独立账号/密码，bcrypt 哈希 + 登录限流防爆破 |
| 商户管理 | 增删改查 + 三语名称/地址 + 分类 + 坐标 + 电话 + 评分 |
| 广告管理 | 重点企业广告位：标题三语、跳转商户、排序、上下架 |
| 图片资料 | `POST /api/upload` 上传商户/广告图片 |
| 系统设置 | 高德 Key / mock 开关 / 城市中心点在线配置，APP 启动实时拉取 |

技术栈：Express 4 + node:sqlite（零原生依赖）+ React 18 / antd 5

## 需求来源

《边小二 手机APP建设构架》（2026-08-04）核心要求：一带一路 + 中亚互免签，每年过千万人次
进出新疆口岸（霍尔果斯、喀什等），语言障碍导致停留在线下消费。本 APP 为外籍人员的工作、
购物、住宿、出行、娱乐提供全面服务；伊犁蓝 + 白色配色，支付宝风格。
