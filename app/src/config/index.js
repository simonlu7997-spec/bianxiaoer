// 全局配置 — 开发期用 mock 数据，上线前填入真实 AMap Key 和后端地址
export default {
  // 高德开放平台 Web 服务 Key — 不再硬编码：由后台「系统设置」在线下发（启动时拉 /api/config）
  // 后台不可达且未下发时，POI 搜索自动回退后台商户/本地数据
  AMAP_KEY: '',

  // 高德栅格瓦片（国内可用，无需原生 SDK；subdomain 1-4）
  AMAP_TILE_URL:
    'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
  AMAP_SUBDOMAINS: ['1', '2', '3', '4'],

  // 后台管理系统 API 地址（公网部署，任何网络可达；本地调试可用局域网 IP）
  BACKEND_URL: 'https://admin.pect-dapp.io',

  // 默认城市与中心点（霍尔果斯口岸）
  DEFAULT_CITY: '霍尔果斯',
  DEFAULT_CENTER: { latitude: 44.2244, longitude: 80.4118 },

  // 支持城市列表（地图页可切换，中心点联动）
  CITIES: [
    { id: 'khorgos', name: '霍尔果斯', center: { latitude: 44.2244, longitude: 80.4118 }, delta: 0.06 },
    { id: 'kashgar', name: '喀什', center: { latitude: 39.4685, longitude: 75.9846 }, delta: 0.06 },
  ],

  // 无 AMAP_KEY 时是否回退本地 mock 数据（后台在线配置会覆盖此值）
  USE_MOCK: true,
};
