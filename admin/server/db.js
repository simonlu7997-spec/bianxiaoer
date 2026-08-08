// 边小二后台管理系统 — 数据库层（Node 内置 SQLite，零原生依赖）
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'bianxiaoer.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  token_version INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  emoji TEXT NOT NULL,
  sort INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT,
  name_ru TEXT,
  category TEXT NOT NULL,
  city TEXT,
  address_zh TEXT,
  address_en TEXT,
  address_ru TEXT,
  desc_zh TEXT,
  desc_en TEXT,
  desc_ru TEXT,
  phone TEXT,
  rating REAL DEFAULT 4.0,
  lat REAL,
  lng REAL,
  featured INTEGER DEFAULT 0,
  image TEXT,
  status INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  title_en TEXT,
  title_ru TEXT,
  merchant_id TEXT,
  bg TEXT DEFAULT '#2E6BE6',
  image TEXT,
  sort_order INTEGER DEFAULT 0,
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  phone TEXT UNIQUE,
  password_hash TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

// 兼容旧库：users.phone 可能非 UNIQUE、缺 password_hash/token_version 列
const userCols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
if (!userCols.includes('password_hash')) {
  db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
}
const adminCols = db.prepare('PRAGMA table_info(admins)').all().map((c) => c.name);
if (!adminCols.includes('token_version')) {
  db.exec('ALTER TABLE admins ADD COLUMN token_version INTEGER DEFAULT 0');
}

// ── 种子数据（首次启动） ──────────────────────────────
const seed = () => {
  const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admins').get().c;
  if (adminCount === 0) {
    // 安全初始化：不再使用固定默认密码，首次启动生成随机密码并仅打印一次
    const initPwd = process.env.ADMIN_INIT_PASSWORD || require('crypto').randomBytes(9).toString('base64url');
    const hash = bcrypt.hashSync(initPwd, 10);
    db.prepare('INSERT INTO admins (account, password_hash) VALUES (?, ?)').run('admin', hash);
    console.log('[seed] 初始管理员账号: admin');
    console.log('[seed] ⚠️ 初始密码（仅本次启动可见，请立即登录后台修改）: ' + initPwd);
  }

  const catCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
  if (catCount === 0) {
    const cats = [
      ['food', '🍜', 1], ['shopping', '🛒', 2], ['autorepair', '🔧', 3],
      ['beauty', '💇', 4], ['leisure', '🎮', 5], ['logistics', '📦', 6],
    ];
    const ins = db.prepare('INSERT INTO categories (id, emoji, sort) VALUES (?, ?, ?)');
    cats.forEach((c) => ins.run(...c));
  }

  const mCount = db.prepare('SELECT COUNT(*) AS c FROM merchants').get().c;
  if (mCount === 0) {
    const merchants = [
      ['m1', '金亿国际商贸城', 'Jinyi International Mall', 'ТЦ Цзиньи', 'shopping', '霍尔果斯',
        '霍尔果斯市亚欧北路', 'YaOu North Rd, Khorgos', 'ул. Яоу Север, Хоргос',
        '中亚最大的跨境商品采购中心', 'The largest cross-border goods center in Central Asia', 'Крупнейший центр трансграничных товаров',
        '0999-8790001', 4.7, 44.2244, 80.4118, 1, 1],
      ['m2', '霍尔果斯国际客运站美食城', 'Khorgos Bus Station Food Court', 'Фуд-корт автовокзала', 'food', '霍尔果斯',
        '霍尔果斯市友谊路客运站内', 'Youyi Rd Bus Station, Khorgos', 'Автовокзал, ул. Юи',
        '汇集抓饭、拉条子、俄餐与哈萨克风味', 'Pilaf, laghman, Russian & Kazakh cuisine', 'Плов, лагман, русская и казахская кухня',
        '0999-8790002', 4.5, 44.2191, 80.4202, 1, 1],
      ['m3', '中哈国际物流园', 'China-Kazakhstan Logistics Park', 'Китайско-казахстанский логистический парк', 'logistics', '霍尔果斯',
        '霍尔果斯市工业园区', 'Industrial Park, Khorgos', 'Промзона, Хоргос',
        '口岸货运、报关、仓储一站式服务', 'Freight, customs & warehousing one-stop', 'Грузоперевозки, таможня, склады',
        '0999-8790003', 4.8, 44.2301, 80.3985, 1, 1],
      ['m4', '喀什古城美食街', 'Kashgar Old Town Food Street', 'Улица еды старого Кашгара', 'food', '喀什',
        '喀什市吾斯塘博依路', 'Ustanboyi Rd, Kashgar', 'ул. Устанбойи, Кашгар',
        '烤鸽子、缸子肉、抓饭一应俱全', 'Roast pigeon, pot meat, pilaf', 'Жареный голубь, плов и др.',
        '0998-2300001', 4.9, 39.4685, 75.9846, 1, 1],
      ['m5', '喀什汽车维修中心', 'Kashgar Auto Repair Center', 'Автосервис Кашгара', 'autorepair', '喀什',
        '喀什市西域大道188号', '188 Xiyu Ave, Kashgar', 'просп. Сиюй 188, Кашгар',
        '中俄双语技师，支持跨境车辆维修', 'Bilingual mechanics, cross-border vehicles', 'Мастера, говорящие по-русски',
        '0998-2300002', 4.3, 39.4621, 75.9922, 0, 1],
      ['m6', '丝路美容养生会所', 'Silk Road Beauty & Spa', 'Салон красоты «Шёлковый путь»', 'beauty', '霍尔果斯',
        '霍尔果斯市北京路12号', '12 Beijing Rd, Khorgos', 'ул. Пекин 12, Хоргос',
        '美发、美甲、SPA，俄语服务', 'Hair, nails, spa. Russian spoken', 'Парикмахер, маникюр, SPA',
        '0999-8790004', 4.6, 44.2168, 80.4155, 0, 1],
      ['m7', '中亚风情娱乐城', 'Central Asia Entertainment Center', 'Развлекательный центр', 'leisure', '霍尔果斯',
        '霍尔果斯市中哈合作中心', 'Khorgos ICBC, Khorgos', 'МЦПС Хоргос',
        '歌舞演艺、棋牌休闲、俄式酒吧', 'Shows, games, Russian bar', 'Шоу, игры, русский бар',
        '0999-8790005', 4.4, 44.2331, 80.4309, 0, 1],
      ['m8', '喀什跨境物流口岸仓', 'Kashgar Cross-border Port Warehouse', 'Приграничный склад Кашгара', 'logistics', '喀什',
        '喀什市红山口口岸物流区', 'Honshankou Port Logistics Zone, Kashgar', 'Зона логистики порта Хуншанькоу',
        '中亚五国专线物流、集货拼车', 'CA-5 dedicated logistics lines', 'Логистика в 5 стран ЦА',
        '0998-2300003', 4.5, 39.4732, 75.9788, 0, 1],
      ['m9', '友好超市（国际店）', 'Youhao Supermarket (Intl)', 'Супермаркет Юхао', 'shopping', '喀什',
        '喀什市解放北路66号', '66 Jiefang North Rd, Kashgar', 'ул. Цзефан Север 66',
        '进口食品、中亚日用品一站购齐', 'Imported foods & daily goods', 'Импортные продукты и товары',
        '0998-2300004', 4.4, 39.4703, 75.9811, 0, 1],
    ];
    const ins = db.prepare(`INSERT INTO merchants
      (id, name_zh, name_en, name_ru, category, city, address_zh, address_en, address_ru,
       desc_zh, desc_en, desc_ru, phone, rating, lat, lng, featured, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    merchants.forEach((m) => ins.run(...m));
    console.log('[seed] 商户: 9 条');
  }

  const aCount = db.prepare('SELECT COUNT(*) AS c FROM ads').get().c;
  if (aCount === 0) {
    const ads = [
      ['a1', '金亿国际商贸城 — 中亚采购第一站', 'Jinyi Intl Mall — #1 in Central Asia', 'ТЦ Цзиньи — выбор №1 в ЦА', 'm1', '#2E6BE6', 1],
      ['a2', '喀什古城美食街 — 舌尖上的喀什', 'Kashgar Old Town Food Street', 'Улица еды старого Кашгара', 'm4', '#F5B301', 2],
      ['a3', '中哈国际物流园 — 一站式跨境物流', 'KZ Logistics Park — One-stop', 'Логистический парк — всё включено', 'm3', '#22C55E', 3],
    ];
    const ins = db.prepare('INSERT INTO ads (id, title_zh, title_en, title_ru, merchant_id, bg, sort_order, enabled) VALUES (?,?,?,?,?,?,?,1)');
    ads.forEach((a) => ins.run(...a));
    console.log('[seed] 广告: 3 条');
  }

  // 系统配置（在线可切换：高德 Key / mock 开关 / 城市中心点）
  const sCount = db.prepare('SELECT COUNT(*) AS c FROM settings').get().c;
  if (sCount === 0) {
    const ins = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    // 高德 Key 不再硬编码进种子：优先环境变量，否则留空由管理员在后台填写
    ins.run('amap_key', process.env.AMAP_KEY || '');
    ins.run('use_mock', 'true');
    ins.run('default_city', '霍尔果斯');
    ins.run('cities', JSON.stringify([
      { id: 'khorgos', name: '霍尔果斯', center: { latitude: 44.2244, longitude: 80.4118 }, delta: 0.06 },
      { id: 'kashgar', name: '喀什', center: { latitude: 39.4685, longitude: 75.9846 }, delta: 0.06 },
    ]));
    console.log('[seed] 系统配置已初始化（高德 Key 需在后台系统设置中填写）');
  }
};

seed();

module.exports = db;
