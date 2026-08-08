import { message } from 'antd';

const TOKEN_KEY = 'bxe_admin_token';
const ACCOUNT_KEY = 'bxe_admin_account';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getAccount = () => localStorage.getItem(ACCOUNT_KEY) || '';
export const setAuth = (token, account) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ACCOUNT_KEY, account);
};
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACCOUNT_KEY);
};

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  let body = null;
  try { body = await res.json(); } catch (e) { /* ignore */ }

  if (res.status === 401) {
    clearAuth();
    if (!location.hash.includes('/login')) {
      message.error(body?.message || '请重新登录');
      setTimeout(() => { location.hash = '#/login'; }, 600);
    }
    throw new Error(body?.message || '未登录');
  }
  if (!res.ok || !body?.success) {
    throw new Error(body?.message || `请求失败 (${res.status})`);
  }
  return body.data;
}

export const api = {
  login: (account, password) => request('/api/admin/login', {
    method: 'POST', body: JSON.stringify({ account, password }),
  }),
  changePassword: (oldPassword, newPassword) => request('/api/admin/change-password', {
    method: 'POST', body: JSON.stringify({ oldPassword, newPassword }),
  }),
  stats: () => request('/api/stats'),
  settings: () => request('/api/settings'),
  saveSettings: (data) => request('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
  categories: () => request('/api/categories'),
  // 管理端列表走鉴权接口（可查看下架商户/停用广告；公开接口只返回上架/启用数据）
  merchants: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
    return request(`/api/admin/merchants${q ? `?${q}` : ''}`);
  },
  createMerchant: (data) => request('/api/merchants', { method: 'POST', body: JSON.stringify(data) }),
  updateMerchant: (id, data) => request(`/api/merchants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMerchant: (id) => request(`/api/merchants/${id}`, { method: 'DELETE' }),
  ads: () => request('/api/admin/ads'),
  createAd: (data) => request('/api/ads', { method: 'POST', body: JSON.stringify(data) }),
  updateAd: (id, data) => request(`/api/ads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAd: (id) => request(`/api/ads/${id}`, { method: 'DELETE' }),
  users: () => request('/api/users'),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
  upload: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    });
    const body = await res.json();
    if (!res.ok || !body?.success) throw new Error(body?.message || '上传失败');
    return body.data.url;
  },
};

// 三语字段 ↔ 扁平字段转换
export const toFlat = (m) => ({
  name_zh: m?.name?.zh || '', name_en: m?.name?.en || '', name_ru: m?.name?.ru || '',
  category: m?.category || 'food', city: m?.city || '霍尔果斯',
  address_zh: m?.address?.zh || '', address_en: m?.address?.en || '', address_ru: m?.address?.ru || '',
  desc_zh: m?.desc?.zh || '', desc_en: m?.desc?.en || '', desc_ru: m?.desc?.ru || '',
  phone: m?.phone || '', rating: m?.rating ?? 4.0, lat: m?.lat ?? null, lng: m?.lng ?? null,
  featured: !!m?.featured, image: m?.image || null, status: m?.status ?? 1,
});
