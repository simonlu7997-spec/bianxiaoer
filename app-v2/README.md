# 边小二 App v2.0.0

中亚入境新疆边境城市游客的三语（中文/English/Русский）口岸生活服务 App。
本版本基于 **GitHub 仓库完整版**（`simonlu7997-spec/bianxiaoer-app` 的 `manus/latest-code-20260808` 分支）重建：
完整采用其首页架构、各功能模块、图片与 Logo，并保留本地地图功能。

## 技术栈

- **Expo SDK 54** / React Native 0.81 / React 19.1
- **TypeScript** 全量类型
- **Expo Router 6**（文件路由，深链 `bianxiaoer://map?city=kashgar` 自动映射）
- **NativeWind 4**（Tailwind CSS，主题 tokens 见 `theme.config.js`，支持深色模式）
- **react-native-maps**（iOS 原生地图 + 高德瓦片）
- **react-native-webview**（Android 地图：WebView + Leaflet + 高德瓦片，无 GMS 依赖）
- **expo-image / expo-video / expo-haptics** 等 GitHub 完整版依赖

## 首页与功能模块（按 GitHub 仓库）

- **顶部**：HomeHeader（定位城市 + 搜索框 + 语言切换弹窗 + 扫码按钮）
- **轮播**：BannerCarousel（3 张云端 banner 图，自动播放 + 圆点指示器）
- **中间**：ServiceGrid（10 个生活服务图标：住宿/出行/餐饮/外卖/购物/汽修/美容/娱乐/物流/贸易 + 地图入口）
- **下方**：热门推荐横滑列表 + 附近商家横滑列表（商户卡片含图片/评分/距离/营业状态）
- **底部导航（5 Tab）**：首页 / 视频 / 团购（中间凸起）/ 购物车 / 我的
- **我的**：登录卡片（手机号+验证码，本地模拟）、订单/收藏 Tab、语言切换、帮助/关于/版本、退出登录
- **其他页面**：搜索（历史/热门词/混合结果）、商户详情（菜单/评价/信息/加购）、团购详情、购物车、登录

## 数据层（本地适配，无 MySQL）

GitHub 完整版依赖 tRPC + MySQL 后端；本地环境无 MySQL，`lib/trpc.ts` 已重写为**本地数据层**，
保持与页面相同的 API 形状（`trpc.catalog.home.useQuery` 等），数据源：
- 本地 mock 商户/团购（`src/data/`）
- 后台管理系统 API（`src/services/MapService` → `https://admin.pect-dapp.io`）
- AsyncStorage（收藏/订单/购物车本地持久化）

## 地图功能（v1 保留）

- **iOS**：react-native-maps + 高德栅格瓦片 UrlTile（中国区可用）
- **Android**：WebView 加载本地内嵌 Leaflet HTML + 高德瓦片（国行无 GMS 设备可用）
- 双端 props/ref 接口一致：`center` / `selectedId` / `onMarkerPress` / `ref.animateToCenter()`
- 数据：后台管理系统在线下发高德 Key / mock 开关 / 城市；有 Key 时 POI 搜索自动拼城市名查高德
- 首页 ServiceGrid 第 11 项「地图」直达地图探索页

## 快速开始

```bash
pnpm install
npx expo start          # 开发（iOS 模拟器 / Expo Go）
node scripts/build-map-html.js   # 生成地图 HTML（Android assets 需先 prebuild）
```

## 目录结构

```
app/
  (tabs)/index.tsx   ← 首页（HomeHeader + Banner + ServiceGrid + 商户横滑）
  (tabs)/video.tsx   ← 视频（占位）
  (tabs)/deals.tsx   ← 团购
  (tabs)/cart.tsx    ← 购物车
  (tabs)/profile.tsx ← 我的
  map.tsx            ← 地图探索（城市切换 + 分类筛选 + 图钉信息卡）★ 本地保留
  search.tsx         ← 搜索
  merchant/[id].tsx  ← 商户详情
  deal/[id].tsx      ← 团购详情
  login.tsx          ← 登录
components/home/     ← HomeHeader / BannerCarousel / ServiceGrid / MerchantCard（GitHub 版）
lib/trpc.ts          ← 本地数据层（替代 tRPC+MySQL）
lib/i18n.ts          ← 三语词条（GitHub 版完整词条）
src/                 ← 地图相关（config / MapService / 地图组件 / 定位）
assets/map-web/      ← Android WebView 地图 HTML（Leaflet 内嵌，构建脚本生成）
scripts/build-map-html.js ← 内嵌 Leaflet → index.html + Android assets 副本
```

## 深链

| 链接 | 页面 |
|------|------|
| `bianxiaoer://map?city=kashgar` | 地图探索（喀什） |
| `bianxiaoer://search` | 搜索 |
| `bianxiaoer://merchant/1` | 商户详情 |
| `bianxiaoer://deals` | 团购 |

## 版本记录

- **2.0.0**：基于 GitHub 仓库完整版（0808 分支）重建，完整采用其首页/模块/图片/Logo，保留本地地图功能
- **1.0.0**：v1（Expo SDK 57 + JS + React Navigation），位于 `../app/`

## 已知事项

- 登录为本地模拟（手机号+验证码任意 6 位即可），预留后端对接
- 团购/购物车/订单为本地 mock + AsyncStorage，未接支付
- admin 管理页保留 GitHub 版 UI，本地数据层返回空（无 MySQL 后端）
- 商户图片：本地数据无封面图时显示占位图标；banner 用 GitHub 仓库云端图
- Android 正式构建需先 `npx expo prebuild` 生成原生工程再构建 APK
