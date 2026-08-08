import config from '../config';

// ─────────────────────────────────────────────────────────────
// 预留后端 API 客户端（对接"后台管理系统"）
// 设计说明（对应文档"后台管理系统设计要简单易于操作，预留接口"）：
//   - 后台独立账号/密码登录（管理员角色）
//   - 商户/广告位/用户数据均由后台下发
//   - 图片资料经 UPLOAD 上传
// 开发期 BACKEND_URL 为空 → 全部走本地 mock，不影响联调
// ─────────────────────────────────────────────────────────────

export const ENDPOINTS = {
  ADMIN_LOGIN: '/api/admin/login',      // POST {account, password} → {token}
  ADMIN_LOGOUT: '/api/admin/logout',
  MERCHANTS: '/api/merchants',          // GET ?city=&category=&keyword=
  MERCHANT_DETAIL: '/api/merchants/:id',
  ADS: '/api/ads',                      // GET → 重点企业广告位
  CATEGORIES: '/api/categories',
  USER_REGISTER: '/api/users/register', // POST {name, phone, password}
  USER_LOGIN: '/api/users/login',
  UPLOAD: '/api/upload',                // POST multipart → {url}
};

const request = async (path, options = {}) => {
  if (!config.BACKEND_URL) {
    throw new Error('BACKEND_URL not configured — using mock mode');
  }
  const { headers, body, ...rest } = options;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  // FormData 不能手动设置 Content-Type（会破坏 multipart boundary），交给 fetch 自动生成
  const h = { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...(headers || {}) };
  const res = await fetch(`${config.BACKEND_URL}${path}`, { ...rest, headers: h, body });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
};

export const api = {
  // 后台管理员登录（独立账号密码）
  adminLogin: (account, password) => request(ENDPOINTS.ADMIN_LOGIN, {
    method: 'POST',
    body: JSON.stringify({ account, password }),
  }),
  fetchMerchants: (params = {}) => request(`${ENDPOINTS.MERCHANTS}?${new URLSearchParams(params)}`),
  fetchAds: () => request(ENDPOINTS.ADS),
  register: (payload) => request(ENDPOINTS.USER_REGISTER, { method: 'POST', body: JSON.stringify(payload) }),
  upload: (formData) => request(ENDPOINTS.UPLOAD, { method: 'POST', body: formData }),
};

export default api;
