# 边小二 (Bian Xiao Er)

面向中亚游客的本地生活向导 APP — 服务霍尔果斯、喀什等新疆口岸城市。
支持 **中文 / English / Русский** 三语，地图找店、搜索商户、导航跳转、重点企业广告位。

## 需求来源

《边小二 手机APP建设构架》（2026-08-04 上传文档）核心要求：

- **目的**：一带一路 + 中亚互免签，每年过千万人次进出新疆口岸（霍尔果斯、喀什等），语言障碍导致仍停留在线下消费模式。本 APP 为外籍人员的工作、购物、住宿、出行、娱乐提供全面服务
- **三语界面**：中文 / 英文 / 第三种文字（按中亚用户推断为俄文，可调整）
- **地图与搜索**：首页配置地理功能，链接百度、高德等知名导航；可直接输入**地址或名称**搜索，跳转到商户
- **内容分类**：餐饮、商超购物、汽车维修、美容美发、休闲娱乐、跨境物流
- **重点企业广告**：广告位可点击
- **色彩**：伊犁蓝 + 白色；整体参考支付宝风格
- **底部导航**：首页 / 出行（车）/ 我的（用户注册信息）
- **后台管理系统**：设计简单易于操作，预留接口，独立账号密码登录，支持图片资料上传

## 技术栈

| 层 | 选型 |
|----|------|
| 框架 | Expo SDK 57 (React Native 0.86, React 19) |
| 导航 | React Navigation 7 (native-stack + bottom-tabs) |
| 地图 | react-native-maps + **高德栅格瓦片**（中国区可用，无需 Google） |
| 定位 | expo-location |
| 存储 | @react-native-async-storage/async-storage |
| 三语 | 自研轻量 i18n（zh/en/ru，可持久化） |
| 数据 | 开发期本地 mock → 预留后端 API（`src/services/ApiClient.js`） |

> 代码基础：GitHub [Explore-Places](https://github.com/panditsamik/Explore-Places)（地图+分类+搜索+收藏结构）
> 在最新 Expo SDK 上重构，非直接沿用其旧依赖。

## 项目结构

```
app/
├── App.js                      # 根组件：Provider + 导航
├── app.json                    # 应用名"边小二"，bundle id，定位权限
└── src/
    ├── i18n/                   # 三语词条 + LanguageProvider
    ├── theme/colors.js         # 伊犁蓝 #2E6BE6 + 白色
    ├── config/index.js         # AMAP_KEY / BACKEND_URL / 默认中心点
    ├── context/                # UserLocationContext（定位）
    ├── data/                   # 分类 / mock 商户 / mock 广告
    ├── services/
    │   ├── MapService.js       # 高德 POI 搜索 + mock 回退 + 导航链接
    │   └── ApiClient.js        # 预留后台接口（登录/商户/广告/上传）
    ├── components/             # Header / AdBanner / CategoryGrid / MerchantCard / MerchantMap
    ├── screens/                # Home / Search / Travel / Profile / MerchantDetail / Fav
    └── navigations/            # Tab（首页/出行/我的）+ Stack
```

## 运行

```bash
cd app
npm install
npx expo start          # iOS 模拟器按 i
npx expo run:ios        # 真机构建（侧载）
```

打包侧载（同上一版 v2 流程）：`ios-deploy --bundle <app.ipa>`

## 上线前待办

1. **高德 Key**：`src/config/index.js` 填入 `AMAP_KEY`（[lbs.amap.com](https://lbs.amap.com) 申请 Web 服务 key）
2. **后端对接**：实现后台管理系统 API（见下），填 `BACKEND_URL`
3. **App 图标/启动图**：替换默认资源
4. **Android 地图**：国内 Android 建议换 `react-native-amap3d` 原生方案（当前用瓦片方案兼容）

## 后台管理系统设计（预留）

按文档"设计简单易于操作、预留接口、独立账号密码登录"：

| 模块 | 说明 |
|------|------|
| 管理员登录 | 独立账号/密码，`POST /api/admin/login` |
| 商户管理 | 增删改查 + 三语名称/地址 + 分类 + 坐标 + 电话 + 评分 |
| 广告管理 | 重点企业广告位：标题三语、跳转商户、排序、上下架 |
| 图片资料 | `POST /api/upload` 上传商户/广告图片，返回 URL |
| 用户管理 | 注册用户列表（预留收藏/反馈同步） |

建议实现为独立 Web 后台（如 Next.js/React + 轻量后端），数据接口契约已在
`src/services/ApiClient.js` 的 `ENDPOINTS` 中定义，APP 侧可直接切换。

## 🗺️ 地图探索（2026-08-04 更新）

- **全屏地图页**：首页分类宫格或「地图探索」按钮进入，霍尔果斯/喀什城市切换（地图中心联动动画），六大分类筛选
- **自定义图钉**：蓝色=普通商户，金色=重点企业；点击弹出**底部信息卡**（三语名/评分/地址/分类 + 导航/高德/电话三按钮）
- **深链支持**：`bianxiaoer://map?city=kashgar`（分享链接直达地图页，Expo Go 用 `exp://host:port/--/map?city=kashgar`）
- 底图：高德瓦片（webrd0{s}.is.autonavi.com），模拟器定位已设为霍尔果斯可显示蓝点

### 地图相关文件
- `src/screens/MapScreen.js` — 全屏地图探索页
- `src/components/MerchantMap.js` — 地图组件（高德瓦片/自定义图钉/城市联动）
- `src/services/MapService.js` — POI 搜索（AMAP_KEY 配置后走真实高德 API）
