// 边小二后台管理系统 — API 服务
// 端口默认 3200，可环境变量 PORT 覆盖
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3200;

// JWT 密钥：优先环境变量；否则从 data/.jwt_secret 读取，首次启动生成随机 64 字节并持久化
// （不再使用公开固定的默认密钥，防止攻击者自行签发管理员 Token）
const secretFile = path.join(__dirname, 'data', '.jwt_secret');
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  try {
    JWT_SECRET = fs.readFileSync(secretFile, 'utf8').trim();
  } catch (e) {
    JWT_SECRET = crypto.randomBytes(48).toString('base64url');
    fs.mkdirSync(path.dirname(secretFile), { recursive: true });
    fs.writeFileSync(secretFile, JWT_SECRET, { mode: 0o600 });
    console.log('[security] 已生成随机 JWT_SECRET 并持久化到 data/.jwt_secret');
  }
}
const TOKEN_TTL = '12h';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ── 上传（图片资料）──────────────────────────────
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── 鉴权 ──────────────────────────────────────
// JWT 携带 token_version（tv）；修改密码后版本 +1，旧 Token 立即失效
const authRequired = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: '未登录' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const admin = db.prepare('SELECT id, account, token_version FROM admins WHERE id = ?').get(payload.id);
    if (!admin || (payload.tv ?? 0) !== admin.token_version) {
      return res.status(401).json({ success: false, message: '登录已失效，请重新登录' });
    }
    req.admin = { id: admin.id, account: admin.account };
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
};

const ok = (res, data) => res.json({ success: true, data });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

// 登录限流（防公网暴力破解）：同一 IP+账号 5 次失败锁 10 分钟
const loginFails = new Map(); // key: ip|account → {count, lockedUntil}
const rateLimit = (req, res, next) => {
  if (req.path !== '/api/admin/login') return next();
  const key = `${req.ip}|${String(req.body?.account || '').trim()}`;
  const rec = loginFails.get(key);
  if (rec && rec.lockedUntil > Date.now()) {
    return fail(res, 429, '尝试次数过多，请 10 分钟后再试');
  }
  req._rateKey = key;
  next();
};

// ── 管理员认证 ─────────────────────────────────
app.post('/api/admin/login', rateLimit, (req, res) => {
  const { account, password } = req.body || {};
  if (!account || !password) return fail(res, 400, '请输入账号和密码');
  const admin = db.prepare('SELECT * FROM admins WHERE account = ?').get(String(account).trim());
  if (!admin || !bcrypt.compareSync(String(password), admin.password_hash)) {
    const key = req._rateKey;
    const rec = loginFails.get(key) || { count: 0, lockedUntil: 0 };
    rec.count += 1;
    if (rec.count >= 5) { rec.lockedUntil = Date.now() + 10 * 60 * 1000; rec.count = 0; }
    loginFails.set(key, rec);
    return fail(res, 401, '账号或密码错误');
  }
  loginFails.delete(req._rateKey);
  const token = jwt.sign(
    { id: admin.id, account: admin.account, tv: admin.token_version },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
  ok(res, { token, account: admin.account });
});

app.post('/api/admin/logout', authRequired, (req, res) => ok(res, true));

app.get('/api/admin/me', authRequired, (req, res) => ok(res, { account: req.admin.account }));

// 修改密码（管理员）——改密后 token_version+1，所有旧 Token 立即失效
app.post('/api/admin/change-password', authRequired, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return fail(res, 400, '请输入旧密码和新密码');
  if (String(newPassword).length < 6) return fail(res, 400, '新密码至少 6 位');
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin || !bcrypt.compareSync(String(oldPassword), admin.password_hash)) {
    return fail(res, 401, '旧密码错误');
  }
  db.prepare('UPDATE admins SET password_hash = ?, token_version = token_version + 1 WHERE id = ?')
    .run(bcrypt.hashSync(String(newPassword), 10), req.admin.id);
  ok(res, true);
});

// ── 统计（仪表盘）──────────────────────────────
app.get('/api/stats', authRequired, (req, res) => {
  const one = (sql) => db.prepare(sql).get().c;
  ok(res, {
    merchants: one('SELECT COUNT(*) AS c FROM merchants'),
    merchantsOn: one('SELECT COUNT(*) AS c FROM merchants WHERE status = 1'),
    ads: one('SELECT COUNT(*) AS c FROM ads'),
    adsOn: one('SELECT COUNT(*) AS c FROM ads WHERE enabled = 1'),
    users: one('SELECT COUNT(*) AS c FROM users'),
    cities: db.prepare('SELECT city, COUNT(*) AS c FROM merchants GROUP BY city').all(),
  });
});

// ── 系统配置（APP 在线拉取 + 管理端在线编辑）──────────
const getSetting = (key, fallback = '') => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
};

// 公开配置：APP 启动时拉取（高德 Key / mock 开关 / 城市列表）
app.get('/api/config', (req, res) => {
  let cities = [];
  try { cities = JSON.parse(getSetting('cities', '[]')); } catch (e) { /* ignore */ }
  ok(res, {
    amapKey: getSetting('amap_key', ''),
    useMock: getSetting('use_mock', 'true') !== 'false',
    defaultCity: getSetting('default_city', '霍尔果斯'),
    cities,
  });
});

// 管理端读写配置（鉴权）
app.get('/api/settings', authRequired, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings ORDER BY key').all();
  ok(res, Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

app.put('/api/settings', authRequired, (req, res) => {
  const body = req.body || {};
  const upd = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const [k, v] of Object.entries(body)) {
    upd.run(k, typeof v === 'string' ? v : JSON.stringify(v));
  }
  ok(res, true);
});

// ── 分类（公开）────────────────────────────────
app.get('/api/categories', (req, res) => {
  ok(res, db.prepare('SELECT * FROM categories ORDER BY sort').all());
});

// ── 商户（公开读 + 管理员写）────────────────────
// 公开接口只返回已上架(status=1)；管理端用鉴权接口 /api/admin/merchants 查看全部
const merchantRow = (r) => r && ({
  id: r.id, name: { zh: r.name_zh, en: r.name_en, ru: r.name_ru },
  category: r.category, city: r.city,
  address: { zh: r.address_zh, en: r.address_en, ru: r.address_ru },
  desc: { zh: r.desc_zh, en: r.desc_en, ru: r.desc_ru },
  phone: r.phone, rating: r.rating, lat: r.lat, lng: r.lng,
  featured: !!r.featured, image: r.image, status: r.status,
});

const merchantQuery = (req, { admin = false } = {}) => {
  const { city, category, keyword } = req.query;
  let sql = 'SELECT * FROM merchants WHERE 1=1';
  const params = [];
  if (!admin) { sql += ' AND status = 1'; }
  if (city) { sql += ' AND city = ?'; params.push(city); }
  if (category && category !== 'all') { sql += ' AND category = ?'; params.push(category); }
  if (keyword) { sql += ' AND (name_zh LIKE ? OR name_en LIKE ? OR name_ru LIKE ? OR address_zh LIKE ?)'; const k = `%${keyword}%`; params.push(k, k, k, k); }
  sql += ' ORDER BY featured DESC, rating DESC';
  return db.prepare(sql).all(...params);
};

app.get('/api/merchants', (req, res) => {
  ok(res, merchantQuery(req).map(merchantRow));
});

// 管理端：查看全部商户（含下架）
app.get('/api/admin/merchants', authRequired, (req, res) => {
  ok(res, merchantQuery(req, { admin: true }).map(merchantRow));
});

app.get('/api/merchants/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM merchants WHERE id = ? AND status = 1').get(req.params.id);
  if (!row) return fail(res, 404, '商户不存在');
  ok(res, merchantRow(row));
});

const merchantFields = (b) => [
  b.name_zh, b.name_en ?? '', b.name_ru ?? '', b.category, b.city ?? '',
  b.address_zh ?? '', b.address_en ?? '', b.address_ru ?? '',
  b.desc_zh ?? '', b.desc_en ?? '', b.desc_ru ?? '',
  b.phone ?? '', b.rating ?? 4.0, b.lat ?? null, b.lng ?? null,
  b.featured ? 1 : 0, b.image ?? null, b.status ?? 1,
];

app.post('/api/merchants', authRequired, (req, res) => {
  const b = req.body || {};
  if (!b.name_zh || !b.category) return fail(res, 400, '名称(中文)和分类必填');
  const id = `m${Date.now()}`;
  db.prepare(`INSERT INTO merchants
    (id, name_zh, name_en, name_ru, category, city, address_zh, address_en, address_ru,
     desc_zh, desc_en, desc_ru, phone, rating, lat, lng, featured, image, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, ...merchantFields(b));
  ok(res, { id });
});

app.put('/api/merchants/:id', authRequired, (req, res) => {
  const b = req.body || {};
  db.prepare(`UPDATE merchants SET
    name_zh=?, name_en=?, name_ru=?, category=?, city=?, address_zh=?, address_en=?, address_ru=?,
    desc_zh=?, desc_en=?, desc_ru=?, phone=?, rating=?, lat=?, lng=?, featured=?, image=?, status=?,
    updated_at=datetime('now','localtime') WHERE id=?`)
    .run(...merchantFields(b), req.params.id);
  ok(res, true);
});

app.delete('/api/merchants/:id', authRequired, (req, res) => {
  db.prepare('DELETE FROM merchants WHERE id = ?').run(req.params.id);
  ok(res, true);
});

// ── 广告（公开读 + 管理员写）────────────────────
// 公开接口只返回启用(enabled=1)；管理端用 /api/admin/ads 查看全部
const adRow = (r) => r && ({
  id: r.id, title: { zh: r.title_zh, en: r.title_en, ru: r.title_ru },
  merchantId: r.merchant_id, bg: r.bg, image: r.image, sortOrder: r.sort_order, enabled: !!r.enabled,
});

app.get('/api/ads', (req, res) => {
  const rows = db.prepare('SELECT * FROM ads WHERE enabled = 1 ORDER BY sort_order').all();
  ok(res, rows.map(adRow));
});

app.get('/api/admin/ads', authRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM ads ORDER BY sort_order').all();
  ok(res, rows.map(adRow));
});

app.post('/api/ads', authRequired, (req, res) => {
  const b = req.body || {};
  if (!b.title_zh) return fail(res, 400, '标题(中文)必填');
  const id = `a${Date.now()}`;
  db.prepare('INSERT INTO ads (id, title_zh, title_en, title_ru, merchant_id, bg, image, sort_order, enabled) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, b.title_zh, b.title_en, b.title_ru, b.merchant_id || null, b.bg || '#2E6BE6', b.image || null, b.sort_order ?? 0, b.enabled ? 1 : 0);
  ok(res, { id });
});

app.put('/api/ads/:id', authRequired, (req, res) => {
  const b = req.body || {};
  db.prepare('UPDATE ads SET title_zh=?, title_en=?, title_ru=?, merchant_id=?, bg=?, image=?, sort_order=?, enabled=? WHERE id=?')
    .run(b.title_zh, b.title_en, b.title_ru, b.merchant_id || null, b.bg || '#2E6BE6', b.image || null, b.sort_order ?? 0, b.enabled ? 1 : 0, req.params.id);
  ok(res, true);
});

app.delete('/api/ads/:id', authRequired, (req, res) => {
  db.prepare('DELETE FROM ads WHERE id = ?').run(req.params.id);
  ok(res, true);
});

// ── 用户（APP 注册/登录 + 管理员）──────────────────
// 简易用户体系：手机号作为账号，bcrypt 存储密码
app.post('/api/users/register', (req, res) => {
  const { name, phone, password } = req.body || {};
  const p = String(phone || '').trim();
  if (!p || !String(password || '').length) return fail(res, 400, '手机号和密码必填');
  if (String(password).length < 6) return fail(res, 400, '密码至少 6 位');
  if (db.prepare('SELECT id FROM users WHERE phone = ?').get(p)) {
    return fail(res, 409, '该手机号已注册');
  }
  const r = db.prepare('INSERT INTO users (name, phone, password_hash) VALUES (?, ?, ?)')
    .run(String(name || '').trim(), p, bcrypt.hashSync(String(password), 10));
  ok(res, { id: Number(r.lastInsertRowid), name: String(name || '').trim(), phone: p });
});

app.post('/api/users/login', (req, res) => {
  const { phone, password } = req.body || {};
  const p = String(phone || '').trim();
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(p);
  if (!user || !user.password_hash || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    return fail(res, 401, '手机号或密码错误');
  }
  ok(res, { id: user.id, name: user.name || '', phone: user.phone });
});

app.get('/api/users', authRequired, (req, res) => {
  ok(res, db.prepare('SELECT id, name, phone, created_at FROM users ORDER BY id DESC').all());
});
app.delete('/api/users/:id', authRequired, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  ok(res, true);
});

// ── 上传（管理员）──────────────────────────────
// 安全上传：只接受位图魔数（PNG/JPEG/GIF/WebP），忽略客户端 MIME 声明，
// 由服务端根据魔数生成安全扩展名（防止上传 HTML/SVG 造成同源 XSS）
const MAGIC = [
  { ext: '.png', match: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a },
  { ext: '.jpg', match: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: '.gif', match: (b) => b.length >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  { ext: '.webp', match: (b) => b.length >= 12 && b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP' },
];

const storage = multer.memoryStorage(); // 先整文件进内存，校验魔数后再落盘
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // 快速预过滤：必须声明为 image/*（最终以魔数为准）
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持图片文件'));
  },
});

const detectExt = (buf) => {
  for (const m of MAGIC) if (m.match(buf)) return m.ext;
  return null;
};

// 上传目录禁止以 HTML/SVG 等类型被浏览器执行
app.use('/uploads', express.static(UPLOAD_DIR, {
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));

app.post('/api/upload', authRequired, upload.single('file'), (req, res) => {
  if (!req.file) return fail(res, 400, '未收到文件');
  const ext = detectExt(req.file.buffer);
  if (!ext) {
    return fail(res, 400, '仅支持 PNG/JPEG/GIF/WebP 图片文件');
  }
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer);
  ok(res, { url: `/uploads/${filename}` });
});

// ── 前端静态资源（构建产物）────────────────────
const WEB_DIST = path.join(__dirname, '..', 'web', 'dist');
if (fs.existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
    res.sendFile(path.join(WEB_DIST, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ success: false, message: err.message || '服务器错误' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 边小二后台管理系统: http://localhost:${PORT}`);
});
