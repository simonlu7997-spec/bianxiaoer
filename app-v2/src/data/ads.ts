// 重点企业广告位（Mock）— 对应文档"重点企业广告可点击"
// target: 'merchant' 跳转商户详情 / 'url' 跳转外部链接
export interface Ad {
  id: string;
  merchantId?: string;
  title: { zh: string; en: string; ru: string };
  bg: string;
  enabled?: boolean;
}

export default [
  {
    id: "a1",
    merchantId: "m1",
    title: {
      zh: "金亿国际商贸城 — 中亚采购第一站",
      en: "Jinyi Intl Mall — #1 in Central Asia",
      ru: "ТЦ Цзиньи — выбор №1 в ЦА",
    },
    bg: "#2E6BE6",
  },
  {
    id: "a2",
    merchantId: "m4",
    title: {
      zh: "喀什古城美食街 — 舌尖上的喀什",
      en: "Kashgar Old Town Food Street",
      ru: "Улица еды старого Кашгара",
    },
    bg: "#F5B301",
  },
  {
    id: "a3",
    merchantId: "m3",
    title: {
      zh: "中哈国际物流园 — 一站式跨境物流",
      en: "KZ Logistics Park — One-stop",
      ru: "Логистический парк — всё включено",
    },
    bg: "#22C55E",
  },
] as Ad[];
