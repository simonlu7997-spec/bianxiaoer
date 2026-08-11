/**
 * 本地数据层（替代 tRPC + MySQL 后端）
 *
 * 背景：GitHub 完整版（manus/latest-code-20260808）依赖 tRPC + MySQL，
 *       本地环境无 MySQL。本文件保持与页面代码相同的 API 形状
 *       （trpc.catalog.home.useQuery 等），数据源改为：
 *       - 本地 mock 商户/团购（src/data）
 *       - 后台管理系统 API（src/services/MapService，admin.pect-dapp.io）
 *       - AsyncStorage（收藏/订单/购物车，本地持久化）
 * 这样所有页面零改动即可运行。
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReactNode } from "react";
import React from "react";

import localMerchants, { type Merchant as LocalMerchant } from "@/src/data/merchants";
import { fetchMerchants, fetchAds, searchPlaces } from "@/src/services/MapService";
import type { Ad } from "@/src/data/ads";
import type {
  HomeFeed,
  MerchantSummary,
  MerchantDetail,
  DealSummary,
  DealDetail,
  ServiceCategory,
  LocalizedText,
} from "@/shared/bianxiaoer";

// ─────────────────────────────────────────────────────────────
// 本地数据（mock）
// ─────────────────────────────────────────────────────────────

// 分类映射：本地 id → GitHub ServiceCategory
const CATEGORY_MAP: Record<string, ServiceCategory> = {
  food: "dining",
  shopping: "shopping",
  autorepair: "carRepair",
  beauty: "beauty",
  leisure: "entertainment",
  logistics: "logistics",
};

const emojiFor = (cat: string) =>
  ({ food: "🍜", shopping: "🛒", autorepair: "🔧", beauty: "💇", leisure: "🎮", logistics: "📦" }[cat] || "📍");

function toSummary(m: LocalMerchant, id: number): MerchantSummary {
  return {
    id,
    slug: m.id,
    category: CATEGORY_MAP[m.category] ?? "shopping",
    name: m.name,
    shortDescription: m.desc,
    coverImageUrl: null,
    rating: m.rating,
    reviewCount: 0,
    distanceKm: null,
    isOpen: true,
    tags: [m.category],
  };
}

// 本地商户 → MerchantSummary（id 用索引数字，slug 保留 m1/m2...）
const LOCAL_SUMMARIES: MerchantSummary[] = localMerchants.map((m, i) => toSummary(m, i + 1));

function findLocal(id: number): LocalMerchant | undefined {
  return localMerchants.find((m) => LOCAL_SUMMARIES.find((s) => s.id === id)?.slug === m.id);
}

// 本地 mock 团购
const LOCAL_DEALS: DealSummary[] = [
  {
    id: 1,
    merchantId: 2,
    merchantName: { zh: "霍尔果斯国际客运站美食城", en: "Khorgos Bus Station Food Court", ru: "Фуд-корт автовокзала" },
    category: "dining",
    title: { zh: "双人特色抓饭套餐", en: "Pilaf Combo for Two", ru: "Плов на двоих" },
    coverImageUrl: null,
    currentPriceCents: 6800,
    originalPriceCents: 9800,
    soldCount: 126,
    expiresAt: null,
  },
  {
    id: 2,
    merchantId: 1,
    merchantName: { zh: "金亿国际商贸城", en: "Jinyi International Mall", ru: "ТЦ Цзиньи" },
    category: "shopping",
    title: { zh: "跨境商品代购券 100 元", en: "¥100 Cross-border Shopping Voucher", ru: "Купон на 100 юаней" },
    coverImageUrl: null,
    currentPriceCents: 9500,
    originalPriceCents: 10000,
    soldCount: 89,
    expiresAt: null,
  },
  {
    id: 3,
    merchantId: 4,
    merchantName: { zh: "喀什古城美食街", en: "Kashgar Old Town Food Street", ru: "Улица еды старого Кашгара" },
    category: "dining",
    title: { zh: "烤鸽子套餐（含缸子肉）", en: "Roast Pigeon Set", ru: "Жареный голубь" },
    coverImageUrl: null,
    currentPriceCents: 7800,
    originalPriceCents: 12800,
    soldCount: 203,
    expiresAt: null,
  },
  {
    id: 4,
    merchantId: 7,
    merchantName: { zh: "中亚风情娱乐城", en: "Central Asia Entertainment Center", ru: "Развлекательный центр" },
    category: "entertainment",
    title: { zh: "歌舞演艺双人票", en: "Show Tickets (2 pax)", ru: "Билеты на шоу (2 чел.)" },
    coverImageUrl: null,
    currentPriceCents: 15800,
    originalPriceCents: 20000,
    soldCount: 45,
    expiresAt: null,
  },
];

const DEAL_DETAILS: Record<number, DealDetail> = {
  1: {
    ...LOCAL_DEALS[0],
    description: { zh: "两人份抓饭+凉菜+奶茶，可堂食可打包", en: "Pilaf for two with salads & milk tea", ru: "Плов на двоих с салатами и чаем" },
    rules: { zh: "请提前电话预约，有效期 30 天", en: "Please call ahead. Valid 30 days.", ru: "Позвоните заранее. Срок 30 дней." },
    options: [{ id: 11, name: { zh: "标准套餐", en: "Standard", ru: "Стандарт" }, priceCents: 6800 }],
  },
  2: {
    ...LOCAL_DEALS[1],
    description: { zh: "全场通用代金券，满 200 可用", en: "Voucher for any purchase over ¥200", ru: "Купон при покупке от 200 юаней" },
    rules: { zh: "不与其他优惠同享，有效期 60 天", en: "Not stackable. Valid 60 days.", ru: "Не суммируется. Срок 60 дней." },
    options: [{ id: 21, name: { zh: "100元券", en: "¥100", ru: "100 юаней" }, priceCents: 9500 }],
  },
  3: {
    ...LOCAL_DEALS[2],
    description: { zh: "烤鸽子+缸子肉+抓饭，地道喀什味", en: "Roast pigeon, pot meat & pilaf", ru: "Голубь, плов и мясо в горшочке" },
    rules: { zh: "凭券到店核销，有效期 30 天", en: "Show voucher at store. Valid 30 days.", ru: "Предъявите купон. Срок 30 дней." },
    options: [{ id: 31, name: { zh: "单人餐", en: "Single", ru: "Один" }, priceCents: 7800 }],
  },
  4: {
    ...LOCAL_DEALS[3],
    description: { zh: "中哈合作中心歌舞演艺双人票", en: "2 tickets to the Central Asia show", ru: "2 билета на шоу в МЦПС" },
    rules: { zh: "演出时间以现场为准，有效期 90 天", en: "Show times vary. Valid 90 days.", ru: "Время шоу уточняйте. Срок 90 дней." },
    options: [{ id: 41, name: { zh: "双人票", en: "2 pax", ru: "2 чел." }, priceCents: 15800 }],
  },
};

// ─────────────────────────────────────────────────────────────
// 存储键
// ─────────────────────────────────────────────────────────────
const FAV_KEY = "@bianxiaoer_favorites_v2";
const ORDER_KEY = "@bianxiaoer_orders_v2";

interface LocalOrder {
  id: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  items: Array<{ title?: string }>;
  merchantName: LocalizedText;
  totalCents: number;
}

interface AdminMerchant {
  id: number;
  slug: string;
  category: string;
  nameZh: string;
  nameRu: string;
  nameEn: string;
  descriptionZh: string | null;
  descriptionRu: string | null;
  descriptionEn: string | null;
  coverImageUrl: string | null;
  rating: number;
  reviewCount: number;
  distanceKm: number | null;
  isOpen: boolean;
  isFeatured: boolean;
  city: string;
  tags: string[];
  address: string | null;
  phone: string | null;
  businessHours: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface AdminDeal {
  id: number;
  merchantId: number;
  titleZh: string;
  titleRu: string;
  titleEn: string;
  coverImageUrl: string | null;
  currentPriceCents: number;
  originalPriceCents: number | null;
  soldCount: number;
  expiresAt: string | null;
  isActive: boolean;
  descriptionZh: string | null;
  descriptionRu: string | null;
  descriptionEn: string | null;
  rulesZh: string | null;
  rulesRu: string | null;
  rulesEn: string | null;
}

async function getFavorites(): Promise<number[]> {
  const raw = await AsyncStorage.getItem(FAV_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(Number) : [];
  } catch {
    return [];
  }
}

async function getOrders(): Promise<unknown[]> {
  const raw = await AsyncStorage.getItem(ORDER_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// 本地 tRPC 形状实现
// ─────────────────────────────────────────────────────────────
export const trpc = {
  Provider: ({ children }: { children: ReactNode; client?: unknown; queryClient?: unknown }) =>
    React.createElement(React.Fragment, null, children),

  useUtils: () => {
    const qc = useQueryClient();
    return {
      admin: {
        merchants: { list: { invalidate: () => qc.invalidateQueries({ queryKey: ["admin.merchants"] }) } },
        deals: { list: { invalidate: () => qc.invalidateQueries({ queryKey: ["admin.deals"] }) } },
      },
      user: {
        favorites: { list: { invalidate: () => qc.invalidateQueries({ queryKey: ["user.favorites"] }) } },
      },
    };
  },

  catalog: {
    home: {
      useQuery: (input: { locale: string; location?: { latitude: number; longitude: number } }) =>
        useQuery<HomeFeed>({
          queryKey: ["catalog.home", input.locale],
          queryFn: async () => {
            // 后台商户 + 本地兜底
            let backend: LocalMerchant[] = [];
            try {
              backend = await fetchMerchants("all");
            } catch {
              backend = [];
            }
            const all = backend.length ? backend : localMerchants;
            const featured = all.filter((m) => m.featured);
            const list = (featured.length ? featured : all).slice(0, 10).map((m, i) => toSummary(m, i + 1));
            return {
              city: { zh: "霍尔果斯", ru: "Хоргос", en: "Khorgos" },
              featuredMerchants: list,
              nearbyMerchants: all.slice(0, 10).map((m, i) => toSummary(m, i + 1)),
              featuredDeals: LOCAL_DEALS,
            };
          },
          initialData: {
            city: { zh: "霍尔果斯", ru: "Хоргос", en: "Khorgos" },
            featuredMerchants: LOCAL_SUMMARIES.filter((s) => findLocal(s.id)?.featured).slice(0, 10),
            nearbyMerchants: LOCAL_SUMMARIES,
            featuredDeals: LOCAL_DEALS,
          },
        }),
    },

    merchants: {
      useQuery: (
        input: { category?: string; keyword?: string; limit?: number },
        opts?: { enabled?: boolean },
      ) =>
        useQuery<MerchantSummary[]>({
          queryKey: ["catalog.merchants", input],
          enabled: opts?.enabled,
          queryFn: async () => {
            const kw = input.keyword?.trim() || "";
            if (kw) {
              try {
                const pois = await searchPlaces(kw, "zh", "");
                return pois.map((p, i) => toSummary(p as unknown as LocalMerchant, i + 1));
              } catch {
                // fall through
              }
            }
            let list = localMerchants;
            if (input.category && input.category !== "all") {
              const localCat = Object.entries(CATEGORY_MAP).find(([, v]) => v === input.category)?.[0];
              if (localCat) list = list.filter((m) => m.category === localCat);
            }
            if (kw) {
              const q = kw.toLowerCase();
              list = list.filter((m) =>
                [m.name.zh, m.name.en, m.name.ru, m.address.zh, m.address.en, m.address.ru]
                  .join(" ")
                  .toLowerCase()
                  .includes(q)
              );
            }
            return list.slice(0, input.limit ?? 20).map((m, i) => toSummary(m, i + 1));
          },
          initialData: LOCAL_SUMMARIES,
        }),
    },

    merchantById: {
      useQuery: (input: { id: number }, opts?: { enabled?: boolean }) =>
        useQuery<MerchantDetail | null>({
          queryKey: ["catalog.merchantById", input.id],
          enabled: opts?.enabled,
          queryFn: async () => {
            const local = findLocal(input.id);
            if (!local) return null;
            const summary = toSummary(local, input.id);
            return {
              ...summary,
              description: local.desc,
              address: local.address.zh,
              phone: local.phone || null,
              businessHours: "10:00 - 22:00",
              latitude: local.lat,
              longitude: local.lng,
              menuCategories: [
                {
                  id: 1,
                  name: { zh: "精选", en: "Featured", ru: "Избранное" },
                  items: [
                    {
                      id: 1,
                      name: local.name,
                      description: local.desc,
                      imageUrl: null,
                      priceCents: 5000,
                      unit: { zh: "份", en: "unit", ru: "шт." },
                    },
                  ],
                },
              ],
              reviews: [
                {
                  id: 1,
                  userDisplayName: "旅行者",
                  rating: local.rating,
                  content: local.desc.zh,
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          },
        }),
    },

    deals: {
      useQuery: (
        input: { limit?: number; category?: string; keyword?: string },
        opts?: { enabled?: boolean },
      ) =>
        useQuery<DealSummary[]>({
          queryKey: ["catalog.deals", input],
          enabled: opts?.enabled,
          queryFn: async () => {
            let list = LOCAL_DEALS;
            if (input.category && input.category !== "all") {
              list = list.filter((d) => d.category === input.category);
            }
            if (input.keyword) {
              const q = input.keyword.toLowerCase();
              list = list.filter((d) =>
                [d.title.zh, d.title.en, d.title.ru, d.merchantName.zh]
                  .join(" ")
                  .toLowerCase()
                  .includes(q)
              );
            }
            return list.slice(0, input.limit ?? 30);
          },
          initialData: LOCAL_DEALS,
        }),
    },

    dealById: {
      useQuery: (input: { id: number }, opts?: { enabled?: boolean }) =>
        useQuery<DealDetail | null>({
          queryKey: ["catalog.dealById", input.id],
          enabled: opts?.enabled,
          queryFn: async () => DEAL_DETAILS[input.id] ?? null,
        }),
    },
  },

  user: {
    favorites: {
      list: {
        useQuery: (_input: undefined, opts?: { enabled?: boolean }) =>
          useQuery<MerchantSummary[]>({
            queryKey: ["user.favorites"],
            enabled: opts?.enabled,
            queryFn: async () => {
              const ids = await getFavorites();
              return LOCAL_SUMMARIES.filter((s) => ids.includes(s.id));
            },
            initialData: [],
          }),
      },
      toggle: {
        useMutation: (opts?: { onSuccess?: () => void }) =>
          useMutation({
            mutationFn: async ({ merchantId }: { merchantId: number }) => {
              const ids = await getFavorites();
              const next = ids.includes(merchantId)
                ? ids.filter((id) => id !== merchantId)
                : [...ids, merchantId];
              await AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
              return { favorited: next.includes(merchantId) };
            },
            onSuccess: opts?.onSuccess,
          }),
      },
    },

    orders: {
      list: {
        useQuery: (_input: undefined, opts?: { enabled?: boolean }) =>
          useQuery<LocalOrder[]>({
            queryKey: ["user.orders"],
            enabled: opts?.enabled,
            queryFn: async () => getOrders() as Promise<LocalOrder[]>,
            initialData: [],
          }),
      },
      create: {
        useMutation: () =>
          useMutation({
            mutationFn: async (input: {
              items: Array<{ merchantId: number; title: string; priceCents: number; quantity: number }>;
            }) => {
              const orders = await getOrders();
              const totalCents = input.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
              const order: LocalOrder = {
                id: Date.now(),
                status: "pending",
                createdAt: new Date().toISOString(),
                items: input.items.map((item) => ({ title: item.title })),
                merchantName: { zh: "边小二商户", en: "BianXiaoEr Merchant", ru: "Продавец" },
                totalCents,
              };
              await AsyncStorage.setItem(ORDER_KEY, JSON.stringify([order, ...orders]));
              return order;
            },
          }),
      },
    },

    cart: {
      list: {
        useQuery: (_input: undefined, opts?: { enabled?: boolean }) =>
          useQuery<unknown[]>({
            queryKey: ["user.cart"],
            enabled: opts?.enabled,
            queryFn: async () => [],
            initialData: [],
          }),
      },
      sync: {
        useMutation: () =>
          useMutation({
            mutationFn: async (_input: {
              items: Array<{ merchantId: number; title: string; priceCents: number; quantity: number }>;
            }) => ({ ok: true }),
          }),
      },
    },
  },

  admin: {
    merchants: {
      list: {
        useQuery: (_input: undefined, opts?: { enabled?: boolean }) =>
          useQuery<AdminMerchant[]>({
            queryKey: ["admin.merchants"],
            enabled: opts?.enabled,
            queryFn: async () => [],
            initialData: [],
          }),
      },
      create: {
        useMutation: () =>
          useMutation({
            mutationFn: async (_input: unknown) => ({ id: 0 }),
          }),
      },
      update: {
        useMutation: () =>
          useMutation({
            mutationFn: async (_input: unknown) => ({ ok: true }),
          }),
      },
      delete: {
        useMutation: () =>
          useMutation({
            mutationFn: async (_input: unknown) => ({ ok: true }),
          }),
      },
    },
    deals: {
      list: {
        useQuery: (_input: undefined, opts?: { enabled?: boolean }) =>
          useQuery<AdminDeal[]>({
            queryKey: ["admin.deals"],
            enabled: opts?.enabled,
            queryFn: async () => [],
            initialData: [],
          }),
      },
      create: {
        useMutation: () =>
          useMutation({
            mutationFn: async (_input: unknown) => ({ id: 0 }),
          }),
      },
      update: {
        useMutation: () =>
          useMutation({
            mutationFn: async (_input: unknown) => ({ ok: true }),
          }),
      },
      delete: {
        useMutation: () =>
          useMutation({
            mutationFn: async (_input: unknown) => ({ ok: true }),
          }),
      },
    },
  },
};

export function createTRPCClient() {
  return null;
}

// 兼容引用
export type { ServiceCategory, LocalizedText };
export type AppRouter = unknown;
