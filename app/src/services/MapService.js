import config from '../config';
import merchants from '../data/merchants';
import ads from '../data/ads';

// ─────────────────────────────────────────────────────────────
// 地图/商户数据服务
// 1. 配置了 AMAP_KEY → 走高德 Web 服务 API（POI 搜索，中国区可用）
//    关键词自动拼接城市名（如"霍尔果斯 餐厅"），保证命中本地结果
// 2. 否则回退本地 mock 商户数据（USE_MOCK）
// ─────────────────────────────────────────────────────────────

const t = (obj, lang) => (obj && obj[lang]) || obj?.zh || '';

const mockSearch = (keyword) => {
  const kw = String(keyword || '').trim().toLowerCase();
  if (!kw) return merchants;
  return merchants.filter((m) =>
    [m.name.zh, m.name.en, m.name.ru, m.address.zh, m.address.en, m.address.ru, m.city]
      .join(' ')
      .toLowerCase()
      .includes(kw)
  );
};

// 分类 → 高德 POI 搜索词
const CATEGORY_KEYWORDS = {
  food: '餐厅 美食',
  shopping: '商场 超市',
  autorepair: '汽车维修',
  beauty: '美容 美发',
  leisure: '娱乐 休闲',
  logistics: '物流',
  all: '',
};

// 高德 POI 关键词搜索（text search）
// 优先匹配后台商户（后台新增/编辑的商户可按名称搜索到），再查高德真实 POI；
// keyword: 用户输入或分类词；city: 城市名（拼进关键词提高命中率）
export const searchPlaces = async (keyword, lang = 'zh', city = config.DEFAULT_CITY) => {
  const kw = String(keyword || '').trim();
  // 1) 后台商户优先：按名称/地址关键词搜索已上架商户
  if (!config.USE_MOCK && config.BACKEND_URL && kw) {
    try {
      const rows = await fetchFromBackend('/api/merchants', { keyword: kw, city: city || '' });
      if (rows.length) return rows;
    } catch (e) { /* 后台不可达 → 继续走高德 */ }
  }
  // 2) 高德真实 POI
  const key = config.AMAP_KEY;
  if (key) {
    try {
      const q = city ? `${city} ${kw}` : kw;
      const url = `https://restapi.amap.com/v3/place/text?key=${config.AMAP_KEY}&keywords=${encodeURIComponent(q)}&citylimit=false&offset=20&page=1&extensions=base`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === '1' && Array.isArray(data.pois)) {
        return data.pois.map((p) => ({
          id: `poi_${p.id}`,
          name: { zh: p.name, en: p.name, ru: p.name },
          category: mapAmapType(p.type),
          city,
          address: { zh: p.address || p.pname + p.cityname, en: p.address || p.name, ru: p.address || p.name },
          phone: p.tel || '',
          rating: 4.0,
          lat: parseFloat(p.location.split(',')[1]),
          lng: parseFloat(p.location.split(',')[0]),
          featured: false,
          desc: { zh: p.type, en: p.type, ru: p.type },
          poi: true,
        }));
      }
    } catch (e) {
      // fall through to mock
    }
  }
  // 3) 回退本地 mock
  if (config.USE_MOCK) return mockSearch(keyword);
  return [];
};

// 按分类搜索真实 POI（地图页分类联动用）
export const searchByCategory = async (categoryId, lang = 'zh', city = config.DEFAULT_CITY) => {
  const kw = CATEGORY_KEYWORDS[categoryId] || '';
  if (!kw) return [];
  return searchPlaces(kw, lang, city);
};

// 商户列表 — 后台 API（USE_MOCK=false 时），否则本地 mock
const apiUrl = (path, params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return `${config.BACKEND_URL}${path}${q.toString() ? `?${q}` : ''}`;
};

const fetchFromBackend = async (path, params) => {
  const res = await fetch(apiUrl(path, params));
  const body = await res.json();
  if (!body?.success || !Array.isArray(body.data)) throw new Error('bad response');
  return body.data;
};

export const fetchMerchants = async (categoryId, city) => {
  if (!config.USE_MOCK && config.BACKEND_URL) {
    try {
      return await fetchFromBackend('/api/merchants', {
        category: categoryId === 'all' ? '' : categoryId,
        city: city || '',
      });
    } catch (e) {
      // 后台不可达 → 回退 mock
    }
  }
  let list = merchants;
  if (categoryId && categoryId !== 'all') list = list.filter((m) => m.category === categoryId);
  if (city) list = list.filter((m) => m.city === city);
  return list;
};

// 按 id 查商户（详情页用；POI 走传入对象）
export const fetchMerchantById = async (id) => {
  if (!config.USE_MOCK && config.BACKEND_URL) {
    try {
      const res = await fetch(apiUrl(`/api/merchants/${id}`));
      const body = await res.json();
      if (body?.success && body.data) return body.data;
    } catch (e) { /* fallback */ }
  }
  return merchants.find((m) => m.id === id) || null;
};

// 广告位 — 后台 API（USE_MOCK=false 时），否则本地 mock
export const fetchAds = async () => {
  if (!config.USE_MOCK && config.BACKEND_URL) {
    try {
      const rows = await fetchFromBackend('/api/ads');
      return rows.filter((a) => a.enabled);
    } catch (e) { /* fallback */ }
  }
  return ads;
};

// 远程配置拉取（启动时调用，在线切换高德 Key / mock 开关 / 城市）
// 带 5 秒超时：后台不可达时快速回退本地配置，避免启动白屏
const CONFIG_TIMEOUT_MS = 5000;
export const loadRemoteConfig = async () => {
  if (!config.BACKEND_URL) return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG_TIMEOUT_MS);
  try {
    const res = await fetch(apiUrl('/api/config'), { signal: ctrl.signal });
    const body = await res.json();
    if (!body?.success || !body.data) return false;
    const d = body.data;
    if (d.amapKey) config.AMAP_KEY = d.amapKey;
    if (typeof d.useMock === 'boolean') config.USE_MOCK = d.useMock;
    if (d.defaultCity) config.DEFAULT_CITY = d.defaultCity;
    if (Array.isArray(d.cities) && d.cities.length) config.CITIES = d.cities;
    return true;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

const amapTypeMap = [
  ['food', ['餐饮', '美食', '餐厅', '咖啡', '茶馆', '酒吧']],
  ['shopping', ['购物', '商场', '超市', '便利店', '市场']],
  ['autorepair', ['汽车维修', '汽车服务', '4s', '加油站']],
  ['beauty', ['美容', '美发', '美甲', 'spa']],
  ['leisure', ['休闲', '娱乐', 'ktv', '洗浴', '棋牌']],
  ['logistics', ['物流', '货运', '快递', '仓储']],
];

function mapAmapType(typeStr = '') {
  const s = String(typeStr || '').toLowerCase();
  for (const [cat, words] of amapTypeMap) {
    if (words.some((w) => s.includes(w.toLowerCase()))) return cat;
  }
  return 'shopping';
}

// 导航链接（百度/高德/苹果）— 文档："链接百度、高德等知名导航"
export const navLinks = (lat, lng, name = '') => ({
  amap: `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(name)}&mode=car&src=bianxiaoer`,
  baidu: `https://api.map.baidu.com/direction?destination=latlng:${lat},${lng}|name:${encodeURIComponent(name)}&coord_type=gcj02&mode=driving&src=bianxiaoer`,
  apple: `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(name)}`,
});

export const merchantName = (m, lang) => t(m?.name, lang);
export const merchantAddress = (m, lang) => t(m?.address, lang);

export default { searchPlaces, searchByCategory, fetchMerchants, fetchMerchantById, fetchAds, loadRemoteConfig, navLinks };

