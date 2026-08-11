import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import React from "react";

export type Language = "zh" | "ru" | "en";

export const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: "zh", label: "中文", nativeLabel: "中文" },
  { code: "ru", label: "Русский", nativeLabel: "РУ" },
  { code: "en", label: "English", nativeLabel: "EN" },
];

const STORAGE_KEY = "@bianxiaoer_language";

export const translations = {
  zh: {
    // App
    appName: "边小二",
    appSlogan: "边境生活，一站服务",

    // 定位
    locating: "定位中...",
    locationPermission: "请允许定位权限",

    // 搜索
    searchPlaceholder: "搜索商家、商品、服务...",

    // 服务类目
    services: {
      accommodation: "住宿",
      transport: "出行",
      dining: "餐饮",
      delivery: "外卖",
      shopping: "购物",
      carRepair: "汽车维修",
      beauty: "美容美发",
      entertainment: "休闲娱乐",
      logistics: "跨境物流",
      trade: "国际贸易",
    },

    // 首页区块
    hotRecommend: "热门推荐",
    seeAll: "查看全部",
    nearbyMerchants: "附近商家",
    latestDeals: "最新团购",

    // 广告轮播
    banners: [
      { title: "在伊犁，做全球生意", subtitle: "一站式边贸服务平台" },
      { title: "跨境物流，畅通无阻", subtitle: "高效连接中亚市场" },
      { title: "边城美食，味道新疆", subtitle: "发现地道美味，轻松预订" },
    ],

    // 底部导航
    tabs: {
      home: "首页",
      video: "视频",
      deals: "团购",
      cart: "购物车",
      profile: "我的",
    },

    // 商户卡片
    distance: "km",
    rating: "分",
    reviews: "评价",
    open: "营业中",
    closed: "已打烊",

    // 通用
    loading: "加载中...",
    retry: "重试",
    noData: "暂无数据",
    more: "更多",
    back: "返回",
    confirm: "确认",
    cancel: "取消",
    save: "保存",
    settings: "设置",
    language: "语言",
    theme: "主题",
    about: "关于",
    logout: "退出登录",
    login: "登录",
    register: "注册",

    // 登录页
    loginTitle: "欢迎使用边小二",
    loginSubtitle: "边境生活，一站服务",
    phoneNumber: "手机号码",
    phoneNumberPlaceholder: "请输入手机号",
    getVerificationCode: "获取验证码",
    verificationCode: "验证码",
    verificationCodePlaceholder: "请输入6位验证码",
    resendCode: "重新发送",
    resendCountdown: "秒后重发",
    loginWithPhone: "手机号登录",
    loginWithOAuth: "其他方式登录",
    agreeTerms: "登录即表示同意",
    termsOfService: "《用户服务协议》",
    privacyPolicy: "《隐私政策》",
    loginSuccess: "登录成功",
    loginFailed: "登录失败，请重试",
    invalidPhone: "请输入正确的手机号",
    invalidCode: "请输入6位验证码",
    codeSent: "验证码已发送",
    skipLogin: "暂不登录",

    // 商户详情
    merchantDetail: "商户详情",
    menu: "菜单",
    reviewsTab: "评价",
    info: "信息",
    callMerchant: "拨打电话",
    navigate: "导航",
    favorite: "收藏",
    unfavorite: "取消收藏",
    businessHours: "营业时间",
    address: "地址",
    phone: "电话",
    noReviews: "暂无评价",
    writeReview: "写评价",
    addToCart: "加入购物车",
    buyNow: "立即购买",

    // 团购
    deals: "团购",
    dealDetail: "团购详情",
    originalPrice: "原价",
    dealPrice: "团购价",
    discount: "折扣",
    sold: "已售",
    remaining: "剩余",
    validUntil: "有效期至",
    useRules: "使用规则",
    buyDeal: "立即抢购",
    dealExpired: "已过期",
    dealSoldOut: "已售罄",
    selectSpec: "选择规格",
    quantity: "数量",
    totalPrice: "合计",
    submitOrder: "提交订单",
    payNow: "立即支付",
    orderSuccess: "下单成功",
    all: "全部",
    food: "美食",
    hotel: "住宿",
    leisure: "休闲",
    beauty: "美容",

    // 个人中心
    myOrders: "我的订单",
    myFavorites: "我的收藏",
    myProfile: "个人资料",
    editProfile: "编辑资料",
    nickname: "昵称",
    memberLevel: "会员等级",
    ordersToUse: "待使用",
    ordersCompleted: "已完成",
    ordersRefunded: "已退款",
    noOrders: "暂无订单",
    noFavorites: "暂无收藏",
    themeLight: "浅色模式",
    themeDark: "深色模式",
    themeAuto: "跟随系统",
    version: "版本",
    contactUs: "联系我们",
    helpCenter: "帮助中心",

    // 购物车
    cartEmpty: "购物车是空的",
    cartEmptyHint: "去首页看看有什么好买的吧",
    cartTotal: "合计",
    cartCheckout: "去结算",
    cartSelectAll: "全选",
    cartSelected: "已选",
    cartItems: "件",
    cartDelete: "删除",
    cartDeleteConfirm: "确定删除该商品？",
    cartClearSelected: "删除已选",
    cartGoShopping: "去逛逛",
    cartCheckoutTitle: "确认订单",
    cartPayment: "支付方式",
    cartAlipay: "支付宝",
    cartWechat: "微信支付",
    cartCash: "现金支付",
    cartOrderPlaced: "订单已提交！",
    cartAddSuccess: "已加入购物车",

    // 搜索
    search: "搜索",
    searchCancel: "取消",
    searchHistory: "搜索历史",
    searchHot: "热门搜索",
    searchClearHistory: "清除历史",
    searchNoResult: "未找到相关结果",
    searchNoResultHint: "试试其他关键词",
    searchMerchants: "商户",
    searchDeals: "团购",
    searchResultCount: "个结果",
  },

  ru: {
    // App
    appName: "БяньСяоЭр",
    appSlogan: "Жизнь на границе, сервис в одном месте",

    // 定位
    locating: "Определение местоположения...",
    locationPermission: "Разрешите доступ к геолокации",

    // 搜索
    searchPlaceholder: "Поиск магазинов, товаров, услуг...",

    // 服务类目
    services: {
      accommodation: "Жильё",
      transport: "Транспорт",
      dining: "Рестораны",
      delivery: "Доставка",
      shopping: "Покупки",
      carRepair: "Авторемонт",
      beauty: "Красота",
      entertainment: "Досуг",
      logistics: "Логистика",
      trade: "Торговля",
    },

    // 首页区块
    hotRecommend: "Рекомендуем",
    seeAll: "Смотреть всё",
    nearbyMerchants: "Рядом с вами",
    latestDeals: "Акции",

    // 广告轮播
    banners: [
      { title: "В Или — торгуй с миром", subtitle: "Единая платформа приграничной торговли" },
      { title: "Трансграничная логистика", subtitle: "Эффективная связь с рынками Центральной Азии" },
      { title: "Кухня приграничного города", subtitle: "Откройте для себя вкусы Синьцзяна" },
    ],

    // 底部导航
    tabs: {
      home: "Главная",
      video: "Видео",
      deals: "Акции",
      cart: "Корзина",
      profile: "Профиль",
    },

    // 商户卡片
    distance: "км",
    rating: "балл",
    reviews: "отзывов",
    open: "Открыто",
    closed: "Закрыто",

    // 通用
    loading: "Загрузка...",
    retry: "Повторить",
    noData: "Нет данных",
    more: "Ещё",
    back: "Назад",
    confirm: "Подтвердить",
    cancel: "Отмена",
    save: "Сохранить",
    settings: "Настройки",
    language: "Язык",
    theme: "Тема",
    about: "О приложении",
    logout: "Выйти",
    login: "Войти",
    register: "Регистрация",

    // вход
    loginTitle: "Добро пожаловать",
    loginSubtitle: "Жизнь на границе, сервис в одном месте",
    phoneNumber: "Номер телефона",
    phoneNumberPlaceholder: "Введите номер телефона",
    getVerificationCode: "Получить код",
    verificationCode: "Код подтверждения",
    verificationCodePlaceholder: "Введите 6-значный код",
    resendCode: "Отправить снова",
    resendCountdown: "сек до повторной отправки",
    loginWithPhone: "Вход по номеру телефона",
    loginWithOAuth: "Другие способы",
    agreeTerms: "Входя, вы соглашаетесь",
    termsOfService: "«Условия использования»",
    privacyPolicy: "«Политика конфиденциальности»",
    loginSuccess: "Вход выполнен",
    loginFailed: "Ошибка входа, повторите",
    invalidPhone: "Введите правильный номер",
    invalidCode: "Введите 6-значный код",
    codeSent: "Код отправлен",
    skipLogin: "Пропустить",

    // детали магазина
    merchantDetail: "Детали",
    menu: "Меню",
    reviewsTab: "Отзывы",
    info: "Инфо",
    callMerchant: "Позвонить",
    navigate: "Маршрут",
    favorite: "Сохранить",
    unfavorite: "Удалить",
    businessHours: "Часы работы",
    address: "Адрес",
    phone: "Телефон",
    noReviews: "Отзывов нет",
    writeReview: "Написать отзыв",
    addToCart: "В корзину",
    buyNow: "Купить",

    // акции
    deals: "Акции",
    dealDetail: "Подробнее",
    originalPrice: "Цена",
    dealPrice: "Скидка",
    discount: "Скидка",
    sold: "Продано",
    remaining: "Осталось",
    validUntil: "Действительно до",
    useRules: "Условия",
    buyDeal: "Купить",
    dealExpired: "Истёк",
    dealSoldOut: "Распродано",
    selectSpec: "Выбрать",
    quantity: "Количество",
    totalPrice: "Итого",
    submitOrder: "Оформить",
    payNow: "Оплатить",
    orderSuccess: "Заказ оформлен",
    all: "Все",
    food: "Еда",
    hotel: "Жильё",
    leisure: "Досуг",
    beauty: "Красота",

    // профиль
    myOrders: "Мои заказы",
    myFavorites: "Избранное",
    myProfile: "Профиль",
    editProfile: "Редактировать",
    nickname: "Никнейм",
    memberLevel: "Уровень",
    ordersToUse: "Активные",
    ordersCompleted: "Завершенные",
    ordersRefunded: "Возврат",
    noOrders: "Нет заказов",
    noFavorites: "Нет избранного",
    themeLight: "Светлая",
    themeDark: "Тёмная",
    themeAuto: "Авто",
    version: "Версия",
    contactUs: "Связьсяс нами",
    helpCenter: "Помощь",

    // корзина
    cartEmpty: "Корзина пуста",
    cartEmptyHint: "Найдите что-нибудь на главной",
    cartTotal: "Итого",
    cartCheckout: "Оформить",
    cartSelectAll: "Все",
    cartSelected: "Выбрано",
    cartItems: "шт.",
    cartDelete: "Удалить",
    cartDeleteConfirm: "Удалить товар?",
    cartClearSelected: "Удалить выбранное",
    cartGoShopping: "Перейти к покупкам",
    cartCheckoutTitle: "Подтвердить заказ",
    cartPayment: "Оплата",
    cartAlipay: "Alipay",
    cartWechat: "WeChat Pay",
    cartCash: "Наличные",
    cartOrderPlaced: "Заказ оформлен!",
    cartAddSuccess: "Добавлено в корзину",

    // поиск
    search: "Поиск",
    searchCancel: "Отмена",
    searchHistory: "История",
    searchHot: "Популярное",
    searchClearHistory: "Очистить",
    searchNoResult: "Ничего не найдено",
    searchNoResultHint: "Попробуйте другие слова",
    searchMerchants: "Магазины",
    searchDeals: "Акции",
    searchResultCount: "результатов",
  },

  en: {
    // App
    appName: "BianXiaoEr",
    appSlogan: "Border Life, One-Stop Service",

    // 定位
    locating: "Locating...",
    locationPermission: "Please allow location access",

    // 搜索
    searchPlaceholder: "Search merchants, products, services...",

    // 服务类目
    services: {
      accommodation: "Stay",
      transport: "Transport",
      dining: "Dining",
      delivery: "Delivery",
      shopping: "Shopping",
      carRepair: "Car Repair",
      beauty: "Beauty",
      entertainment: "Fun",
      logistics: "Logistics",
      trade: "Trade",
    },

    // 首页区块
    hotRecommend: "Hot Picks",
    seeAll: "See All",
    nearbyMerchants: "Nearby",
    latestDeals: "Latest Deals",

    // 广告轮播
    banners: [
      { title: "Trade with the World from Yili", subtitle: "One-stop border trade platform" },
      { title: "Cross-border Logistics", subtitle: "Connecting Central Asian markets" },
      { title: "Border City Cuisine", subtitle: "Discover authentic Xinjiang flavors" },
    ],

    // 底部导航
    tabs: {
      home: "Home",
      video: "Video",
      deals: "Deals",
      cart: "Cart",
      profile: "Me",
    },

    // 商户卡片
    distance: "km",
    rating: "pts",
    reviews: "reviews",
    open: "Open",
    closed: "Closed",

    // 通用
    loading: "Loading...",
    retry: "Retry",
    noData: "No data",
    more: "More",
    back: "Back",
    confirm: "Confirm",
    cancel: "Cancel",
    save: "Save",
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    about: "About",
    logout: "Logout",
    login: "Login",
    register: "Register",

    // login
    loginTitle: "Welcome to BianXiaoEr",
    loginSubtitle: "Border Life, One-Stop Service",
    phoneNumber: "Phone Number",
    phoneNumberPlaceholder: "Enter your phone number",
    getVerificationCode: "Get Code",
    verificationCode: "Verification Code",
    verificationCodePlaceholder: "Enter 6-digit code",
    resendCode: "Resend",
    resendCountdown: "s to resend",
    loginWithPhone: "Login with Phone",
    loginWithOAuth: "Other Login Methods",
    agreeTerms: "By logging in, you agree to",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    loginSuccess: "Login successful",
    loginFailed: "Login failed, please retry",
    invalidPhone: "Please enter a valid phone number",
    invalidCode: "Please enter the 6-digit code",
    codeSent: "Code sent",
    skipLogin: "Skip for now",

    // merchant detail
    merchantDetail: "Merchant Detail",
    menu: "Menu",
    reviewsTab: "Reviews",
    info: "Info",
    callMerchant: "Call",
    navigate: "Navigate",
    favorite: "Favorite",
    unfavorite: "Unfavorite",
    businessHours: "Business Hours",
    address: "Address",
    phone: "Phone",
    noReviews: "No reviews yet",
    writeReview: "Write a Review",
    addToCart: "Add to Cart",
    buyNow: "Buy Now",

    // deals
    deals: "Deals",
    dealDetail: "Deal Detail",
    originalPrice: "Original",
    dealPrice: "Deal Price",
    discount: "Off",
    sold: "Sold",
    remaining: "Left",
    validUntil: "Valid Until",
    useRules: "Rules",
    buyDeal: "Grab Now",
    dealExpired: "Expired",
    dealSoldOut: "Sold Out",
    selectSpec: "Select",
    quantity: "Qty",
    totalPrice: "Total",
    submitOrder: "Place Order",
    payNow: "Pay Now",
    orderSuccess: "Order Placed",
    all: "All",
    food: "Food",
    hotel: "Hotel",
    leisure: "Leisure",
    beauty: "Beauty",

    // profile
    myOrders: "My Orders",
    myFavorites: "My Favorites",
    myProfile: "Profile",
    editProfile: "Edit Profile",
    nickname: "Nickname",
    memberLevel: "Member Level",
    ordersToUse: "Active",
    ordersCompleted: "Completed",
    ordersRefunded: "Refunded",
    noOrders: "No orders yet",
    noFavorites: "No favorites yet",
    themeLight: "Light",
    themeDark: "Dark",
    themeAuto: "Auto",
    version: "Version",
    contactUs: "Contact Us",
    helpCenter: "Help Center",

    // cart
    cartEmpty: "Your cart is empty",
    cartEmptyHint: "Find something you like on the home page",
    cartTotal: "Total",
    cartCheckout: "Checkout",
    cartSelectAll: "All",
    cartSelected: "Selected",
    cartItems: "item(s)",
    cartDelete: "Delete",
    cartDeleteConfirm: "Remove this item?",
    cartClearSelected: "Remove Selected",
    cartGoShopping: "Go Shopping",
    cartCheckoutTitle: "Confirm Order",
    cartPayment: "Payment",
    cartAlipay: "Alipay",
    cartWechat: "WeChat Pay",
    cartCash: "Cash",
    cartOrderPlaced: "Order Placed!",
    cartAddSuccess: "Added to cart",

    // search
    search: "Search",
    searchCancel: "Cancel",
    searchHistory: "Recent Searches",
    searchHot: "Trending",
    searchClearHistory: "Clear History",
    searchNoResult: "No results found",
    searchNoResultHint: "Try different keywords",
    searchMerchants: "Merchants",
    searchDeals: "Deals",
    searchResultCount: "results",
  },
} as const;

export type TranslationKeys = typeof translations.zh;

// Context
interface I18nContextType {
  language: Language;
  t: TranslationKeys;
  setLanguage: (lang: Language) => void;
}

export const I18nContext = createContext<I18nContextType>({
  language: "zh",
  t: translations.zh,
  setLanguage: () => {},
});

export function useI18n() {
  return useContext(I18nContext);
}

export function useI18nProvider() {
  const [language, setLanguageState] = useState<Language>("zh");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored && (stored === "zh" || stored === "ru" || stored === "en")) {
        setLanguageState(stored as Language);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  return {
    language,
    t: translations[language] as TranslationKeys,
    setLanguage,
  };
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const value = useI18nProvider();
  return React.createElement(I18nContext.Provider, { value }, children);
}
