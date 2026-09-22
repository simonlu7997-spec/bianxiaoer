import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/shared/bianxiaoer";
import { startOAuthLogin } from "@/constants/oauth";

type Section = "overview" | "merchants" | "deals";

type MerchantDraft = {
  id?: number;
  slug: string;
  category: ServiceCategory;
  nameZh: string;
  nameRu: string;
  nameEn: string;
  descriptionZh: string;
  descriptionRu: string;
  descriptionEn: string;
  coverImageUrl: string;
  rating: string;
  reviewCount: string;
  distanceKm: string;
  isOpen: boolean;
  isFeatured: boolean;
  city: string;
  tags: string;
  address: string;
  phone: string;
  businessHours: string;
  latitude: string;
  longitude: string;
};

type DealDraft = {
  id?: number;
  merchantId: string;
  titleZh: string;
  titleRu: string;
  titleEn: string;
  coverImageUrl: string;
  currentPrice: string;
  originalPrice: string;
  soldCount: string;
  expiresAt: string;
  isActive: boolean;
  descriptionZh: string;
  descriptionRu: string;
  descriptionEn: string;
  rulesZh: string;
  rulesRu: string;
  rulesEn: string;
};

const categoryLabels: Record<ServiceCategory, string> = {
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
  hotel: "酒店",
};

function blankMerchant(): MerchantDraft {
  return {
    slug: "",
    category: "dining",
    nameZh: "",
    nameRu: "",
    nameEn: "",
    descriptionZh: "",
    descriptionRu: "",
    descriptionEn: "",
    coverImageUrl: "",
    rating: "0",
    reviewCount: "0",
    distanceKm: "",
    isOpen: true,
    isFeatured: false,
    city: "霍尔果斯",
    tags: "",
    address: "",
    phone: "",
    businessHours: "",
    latitude: "",
    longitude: "",
  };
}

function blankDeal(): DealDraft {
  return {
    merchantId: "",
    titleZh: "",
    titleRu: "",
    titleEn: "",
    coverImageUrl: "",
    currentPrice: "",
    originalPrice: "",
    soldCount: "0",
    expiresAt: "",
    isActive: true,
    descriptionZh: "",
    descriptionRu: "",
    descriptionEn: "",
    rulesZh: "",
    rulesRu: "",
    rulesEn: "",
  };
}

function asAmount(value: string, label: string, allowEmpty = false) {
  if (allowEmpty && !value.trim()) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label}必须是有效的非负数。`);
  return number;
}

function asCents(value: string, label: string, allowEmpty = false) {
  const amount = asAmount(value, label, allowEmpty);
  return amount === undefined ? undefined : Math.round(amount * 100);
}

function FormInput({ label, value, onChangeText, placeholder, multiline = false, keyboardType }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "url";
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={[styles.input, multiline && styles.textarea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.foreground }]}
      />
    </View>
  );
}

function SwitchRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  const colors = useColors();
  return (
    <View style={[styles.switchRow, { borderColor: colors.border }]}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.primary }} />
    </View>
  );
}

function EmptyState({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={styles.emptyState}>
      <IconSymbol name="tray.fill" size={32} color={colors.muted} />
      <Text style={[styles.emptyText, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const colors = useColors();
  const { user, loading } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [merchantDraft, setMerchantDraft] = useState<MerchantDraft | null>(null);
  const [dealDraft, setDealDraft] = useState<DealDraft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const merchantQuery = trpc.admin.merchants.list.useQuery(undefined, { enabled: Boolean(user) });
  const dealsQuery = trpc.admin.deals.list.useQuery(undefined, { enabled: Boolean(user) });
  const createMerchant = trpc.admin.merchants.create.useMutation();
  const updateMerchant = trpc.admin.merchants.update.useMutation();
  const deleteMerchant = trpc.admin.merchants.delete.useMutation();
  const createDeal = trpc.admin.deals.create.useMutation();
  const updateDeal = trpc.admin.deals.update.useMutation();
  const deleteDeal = trpc.admin.deals.delete.useMutation();

  const merchants = merchantQuery.data ?? [];
  const deals = dealsQuery.data ?? [];
  const queryError = merchantQuery.error ?? dealsQuery.error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorCode = (queryError as any)?.data?.code;
  const counts = {
    merchant: merchants.length,
    featured: merchants.filter((merchant) => merchant.isFeatured).length,
    deal: deals.length,
    activeDeal: deals.filter((deal) => deal.isActive).length,
  };

  const refresh = async () => {
    await Promise.all([utils.admin.merchants.list.invalidate(), utils.admin.deals.list.invalidate()]);
  };

  const saveMerchant = async () => {
    if (!merchantDraft) return;
    try {
      const data = {
        slug: merchantDraft.slug.trim(),
        category: merchantDraft.category,
        nameZh: merchantDraft.nameZh.trim(),
        nameRu: merchantDraft.nameRu.trim(),
        nameEn: merchantDraft.nameEn.trim(),
        descriptionZh: merchantDraft.descriptionZh.trim() || undefined,
        descriptionRu: merchantDraft.descriptionRu.trim() || undefined,
        descriptionEn: merchantDraft.descriptionEn.trim() || undefined,
        coverImageUrl: merchantDraft.coverImageUrl.trim() || undefined,
        rating: asAmount(merchantDraft.rating, "评分") ?? 0,
        reviewCount: Math.round(asAmount(merchantDraft.reviewCount, "评价数") ?? 0),
        distanceKm: asAmount(merchantDraft.distanceKm, "距离", true),
        isOpen: merchantDraft.isOpen,
        isFeatured: merchantDraft.isFeatured,
        city: merchantDraft.city.trim(),
        address: merchantDraft.address.trim() || undefined,
        phone: merchantDraft.phone.trim() || undefined,
        businessHours: merchantDraft.businessHours.trim() || undefined,
        latitude: asAmount(merchantDraft.latitude, "纬度", true),
        longitude: asAmount(merchantDraft.longitude, "经度", true),
        tags: merchantDraft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      };
      if (merchantDraft.id) {
        await updateMerchant.mutateAsync({ id: merchantDraft.id, data });
      } else {
        await createMerchant.mutateAsync(data);
      }
      setMerchantDraft(null);
      setNotice("商户信息已保存。");
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "商户保存失败，请检查字段后重试。");
    }
  };

  const saveDeal = async () => {
    if (!dealDraft) return;
    try {
      const date = dealDraft.expiresAt.trim() ? new Date(dealDraft.expiresAt.trim()) : undefined;
      if (date && Number.isNaN(date.getTime())) throw new Error("截止时间应为可识别的日期，例如 2026-12-31T23:59:59Z。");
      const data = {
        merchantId: Math.round(asAmount(dealDraft.merchantId, "商户 ID") ?? 0),
        titleZh: dealDraft.titleZh.trim(),
        titleRu: dealDraft.titleRu.trim(),
        titleEn: dealDraft.titleEn.trim(),
        coverImageUrl: dealDraft.coverImageUrl.trim() || undefined,
        currentPriceCents: asCents(dealDraft.currentPrice, "团购价") ?? 0,
        originalPriceCents: asCents(dealDraft.originalPrice, "原价", true),
        soldCount: Math.round(asAmount(dealDraft.soldCount, "已售数量") ?? 0),
        expiresAt: date,
        isActive: dealDraft.isActive,
        descriptionZh: dealDraft.descriptionZh.trim() || undefined,
        descriptionRu: dealDraft.descriptionRu.trim() || undefined,
        descriptionEn: dealDraft.descriptionEn.trim() || undefined,
        rulesZh: dealDraft.rulesZh.trim() || undefined,
        rulesRu: dealDraft.rulesRu.trim() || undefined,
        rulesEn: dealDraft.rulesEn.trim() || undefined,
      };
      if (dealDraft.id) {
        await updateDeal.mutateAsync({ id: dealDraft.id, data });
      } else {
        await createDeal.mutateAsync(data);
      }
      setDealDraft(null);
      setNotice("团购信息已保存。");
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "团购保存失败，请检查字段后重试。");
    }
  };

  const confirmDeleteMerchant = (id: number) => Alert.alert("删除商户", "删除后无法恢复；若有关联团购，系统会阻止删除。", [
    { text: "取消", style: "cancel" },
    { text: "删除", style: "destructive", onPress: () => deleteMerchant.mutateAsync({ id }).then(refresh).catch((error) => setNotice(error.message)) },
  ]);
  const confirmDeleteDeal = (id: number) => Alert.alert("删除团购", "删除后无法恢复。", [
    { text: "取消", style: "cancel" },
    { text: "删除", style: "destructive", onPress: () => deleteDeal.mutateAsync({ id }).then(refresh).catch((error) => setNotice(error.message)) },
  ]);

  if (loading) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  }
  if (!user || errorCode === "UNAUTHORIZED") {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <View style={[styles.accessCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="lock.fill" size={28} color={colors.primary} />
          <Text style={[styles.accessTitle, { color: colors.foreground }]}>边小二运营后台</Text>
          <Text style={[styles.accessText, { color: colors.muted }]}>请使用统一身份登录；系统将由服务端校验管理员权限。</Text>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => void startOAuthLogin("/admin").catch(() => Alert.alert("登录失败", "无法打开统一身份登录，请稍后重试。"))}
          ><Text style={styles.primaryButtonText}>统一身份登录</Text></Pressable>
        </View>
      </ScreenContainer>
    );
  }
  if (errorCode === "FORBIDDEN") {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <View style={[styles.accessCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="person.crop.circle.badge.exclamationmark" size={28} color={colors.warning} />
          <Text style={[styles.accessTitle, { color: colors.foreground }]}>当前账号没有管理权限</Text>
          <Text style={[styles.accessText, { color: colors.muted }]}>请使用项目所有者对应的运营账号登录。权限仅在服务端校验，不会由前端绕过。</Text>
          <Pressable style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={() => router.replace("/(tabs)")}><Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>返回应用</Text></Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: "#0F3C68" }]}>
        <View>
          <Text style={styles.brand}>边小二运营后台</Text>
          <Text style={styles.subtitle}>商户、团购与三语言目录维护</Text>
        </View>
        <Pressable onPress={() => void refresh()} style={styles.refreshButton}><IconSymbol name="arrow.clockwise" size={18} color="#FFFFFF" /></Pressable>
      </View>
      <View style={[styles.nav, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(["overview", "merchants", "deals"] as Section[]).map((item) => {
          const labels: Record<Section, string> = { overview: "概览", merchants: "商户", deals: "团购" };
          return <Pressable key={item} onPress={() => setSection(item)} style={[styles.navItem, section === item && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}><Text style={[styles.navText, { color: section === item ? colors.primary : colors.muted }]}>{labels[item]}</Text></Pressable>;
        })}
      </View>
      {notice && <Pressable onPress={() => setNotice(null)} style={[styles.notice, { backgroundColor: colors.warning + "20", borderColor: colors.warning }]}><Text style={[styles.noticeText, { color: colors.foreground }]}>{notice}</Text><IconSymbol name="xmark" size={16} color={colors.foreground} /></Pressable>}
      {section === "overview" && <FlatList data={[]} renderItem={null} ListHeaderComponent={<Overview counts={counts} colors={colors} />} contentContainerStyle={styles.page} />}
      {section === "merchants" && (
        <FlatList
          data={merchants}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.page}
          ListHeaderComponent={<PageTitle title="商户目录" action="新增商户" onAction={() => setMerchantDraft(blankMerchant())} />}
          ListEmptyComponent={<EmptyState label="暂未创建商户，点击“新增商户”开始维护。" />}
          renderItem={({ item }) => (
            <MerchantRow
              item={item}
              onEdit={() => setMerchantDraft({ id: item.id, slug: item.slug, category: item.category as ServiceCategory, nameZh: item.nameZh, nameRu: item.nameRu, nameEn: item.nameEn, descriptionZh: item.descriptionZh ?? "", descriptionRu: item.descriptionRu ?? "", descriptionEn: item.descriptionEn ?? "", coverImageUrl: item.coverImageUrl ?? "", rating: String(item.rating), reviewCount: String(item.reviewCount), distanceKm: item.distanceKm === null ? "" : String(item.distanceKm), isOpen: item.isOpen, isFeatured: item.isFeatured, city: item.city, tags: Array.isArray(item.tags) ? (item.tags as string[]).join(", ") : "", address: item.address ?? "", phone: item.phone ?? "", businessHours: item.businessHours ?? "", latitude: item.latitude === null ? "" : String(item.latitude), longitude: item.longitude === null ? "" : String(item.longitude) })}
              onDelete={() => confirmDeleteMerchant(item.id)}
            />
          )}
        />
      )}
      {section === "deals" && (
        <FlatList
          data={deals}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.page}
          ListHeaderComponent={<PageTitle title="团购目录" action="新增团购" onAction={() => setDealDraft(blankDeal())} />}
          ListEmptyComponent={<EmptyState label="暂未创建团购，先建立商户后即可新增团购。" />}
          renderItem={({ item }) => (
            <DealRow
              item={item}
              onEdit={() => setDealDraft({ id: item.id, merchantId: String(item.merchantId), titleZh: item.titleZh, titleRu: item.titleRu, titleEn: item.titleEn, coverImageUrl: item.coverImageUrl ?? "", currentPrice: (item.currentPriceCents / 100).toFixed(2), originalPrice: item.originalPriceCents === null ? "" : (item.originalPriceCents / 100).toFixed(2), soldCount: String(item.soldCount), expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString() : "", isActive: item.isActive, descriptionZh: item.descriptionZh ?? "", descriptionRu: item.descriptionRu ?? "", descriptionEn: item.descriptionEn ?? "", rulesZh: item.rulesZh ?? "", rulesRu: item.rulesRu ?? "", rulesEn: item.rulesEn ?? "" })}
              onDelete={() => confirmDeleteDeal(item.id)}
            />
          )}
        />
      )}
      <MerchantModal draft={merchantDraft} onChange={setMerchantDraft} onClose={() => setMerchantDraft(null)} onSave={() => void saveMerchant()} saving={createMerchant.isPending || updateMerchant.isPending} />
      <DealModal draft={dealDraft} merchants={merchants} onChange={setDealDraft} onClose={() => setDealDraft(null)} onSave={() => void saveDeal()} saving={createDeal.isPending || updateDeal.isPending} />
    </ScreenContainer>
  );
}

function Overview({ counts, colors }: { counts: { merchant: number; featured: number; deal: number; activeDeal: number }; colors: ReturnType<typeof useColors> }) {
  const cards = [{ label: "全部商户", value: counts.merchant, icon: "storefront.fill" as const }, { label: "首页推荐", value: counts.featured, icon: "star.fill" as const }, { label: "全部团购", value: counts.deal, icon: "tag.fill" as const }, { label: "启用团购", value: counts.activeDeal, icon: "checkmark.circle.fill" as const }];
  return <View><Text style={[styles.pageTitle, { color: colors.foreground }]}>运营概览</Text><Text style={[styles.pageHint, { color: colors.muted }]}>所有目录变更会经服务端校验后写入数据库，并同步到移动端首页与搜索。</Text><View style={styles.statsGrid}>{cards.map((card) => <View key={card.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name={card.icon} size={20} color={colors.primary} /><Text style={[styles.statValue, { color: colors.foreground }]}>{card.value}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>{card.label}</Text></View>)}</View></View>;
}

function PageTitle({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  const colors = useColors();
  return <View style={styles.titleRow}><View><Text style={[styles.pageTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.pageHint, { color: colors.muted }]}>中、俄、英文内容必须同时维护。</Text></View><Pressable style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={onAction}><IconSymbol name="plus" size={16} color="#FFFFFF" /><Text style={styles.actionButtonText}>{action}</Text></Pressable></View>;
}

function MerchantRow({ item, onEdit, onDelete }: { item: any; onEdit: () => void; onDelete: () => void }) {
  const colors = useColors();
  return <View style={[styles.recordCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.recordTop}><View style={styles.recordGrow}><Text style={[styles.recordTitle, { color: colors.foreground }]}>{item.nameZh}</Text><Text style={[styles.recordMeta, { color: colors.muted }]}>{item.nameRu} · {item.nameEn}</Text><Text style={[styles.recordMeta, { color: colors.muted }]}>{categoryLabels[item.category as ServiceCategory]} · {item.city} · {item.isOpen ? "营业中" : "已打烊"}</Text></View>{item.isFeatured && <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}><Text style={[styles.badgeText, { color: colors.primary }]}>推荐</Text></View>}</View><View style={styles.rowActions}><Pressable onPress={onEdit} style={[styles.rowButton, { borderColor: colors.border }]}><Text style={[styles.rowButtonText, { color: colors.foreground }]}>编辑</Text></Pressable><Pressable onPress={onDelete} style={[styles.rowButton, { borderColor: colors.error }]}><Text style={[styles.rowButtonText, { color: colors.error }]}>删除</Text></Pressable></View></View>;
}

function DealRow({ item, onEdit, onDelete }: { item: any; onEdit: () => void; onDelete: () => void }) {
  const colors = useColors();
  return <View style={[styles.recordCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.recordTop}><View style={styles.recordGrow}><Text style={[styles.recordTitle, { color: colors.foreground }]}>{item.titleZh}</Text><Text style={[styles.recordMeta, { color: colors.muted }]}>{item.titleRu} · {item.titleEn}</Text><Text style={[styles.recordMeta, { color: colors.muted }]}>商户 ID {item.merchantId} · ¥{(item.currentPriceCents / 100).toFixed(2)} · 已售 {item.soldCount}</Text></View><View style={[styles.badge, { backgroundColor: item.isActive ? colors.success + "18" : colors.border }]}><Text style={[styles.badgeText, { color: item.isActive ? colors.success : colors.muted }]}>{item.isActive ? "启用" : "停用"}</Text></View></View><View style={styles.rowActions}><Pressable onPress={onEdit} style={[styles.rowButton, { borderColor: colors.border }]}><Text style={[styles.rowButtonText, { color: colors.foreground }]}>编辑</Text></Pressable><Pressable onPress={onDelete} style={[styles.rowButton, { borderColor: colors.error }]}><Text style={[styles.rowButtonText, { color: colors.error }]}>删除</Text></Pressable></View></View>;
}

function MerchantModal({ draft, onChange, onClose, onSave, saving }: { draft: MerchantDraft | null; onChange: (draft: MerchantDraft) => void; onClose: () => void; onSave: () => void; saving: boolean }) {
  const colors = useColors();
  if (!draft) return null;
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalOverlay}><View style={[styles.modalSheet, { backgroundColor: colors.background }]}><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>{draft.id ? "编辑商户" : "新增商户"}</Text><Pressable onPress={onClose}><IconSymbol name="xmark" size={20} color={colors.foreground} /></Pressable></View><ScrollView contentContainerStyle={styles.formContent}><FormInput label="唯一标识（slug）" value={draft.slug} onChangeText={(value) => onChange({ ...draft, slug: value })} placeholder="例如 yili-hotel" /><Text style={[styles.fieldLabel, { color: colors.foreground }]}>服务分类</Text><View style={styles.categoryWrap}>{SERVICE_CATEGORIES.map((category) => <Pressable key={category} onPress={() => onChange({ ...draft, category })} style={[styles.categoryChip, { borderColor: draft.category === category ? colors.primary : colors.border, backgroundColor: draft.category === category ? colors.primary + "18" : colors.surface }]}><Text style={{ color: draft.category === category ? colors.primary : colors.foreground }}>{categoryLabels[category]}</Text></Pressable>)}</View><FormInput label="中文名称" value={draft.nameZh} onChangeText={(value) => onChange({ ...draft, nameZh: value })} /><FormInput label="俄文名称" value={draft.nameRu} onChangeText={(value) => onChange({ ...draft, nameRu: value })} /><FormInput label="英文名称" value={draft.nameEn} onChangeText={(value) => onChange({ ...draft, nameEn: value })} /><FormInput label="中文简介" value={draft.descriptionZh} onChangeText={(value) => onChange({ ...draft, descriptionZh: value })} multiline /><FormInput label="俄文简介" value={draft.descriptionRu} onChangeText={(value) => onChange({ ...draft, descriptionRu: value })} multiline /><FormInput label="英文简介" value={draft.descriptionEn} onChangeText={(value) => onChange({ ...draft, descriptionEn: value })} multiline /><FormInput label="封面图片 URL（可选）" value={draft.coverImageUrl} onChangeText={(value) => onChange({ ...draft, coverImageUrl: value })} keyboardType="url" /><FormInput label="评分（0–5）" value={draft.rating} onChangeText={(value) => onChange({ ...draft, rating: value })} keyboardType="decimal-pad" /><FormInput label="评价数" value={draft.reviewCount} onChangeText={(value) => onChange({ ...draft, reviewCount: value })} keyboardType="numeric" /><FormInput label="距离（公里，可选）" value={draft.distanceKm} onChangeText={(value) => onChange({ ...draft, distanceKm: value })} keyboardType="decimal-pad" /><FormInput label="城市" value={draft.city} onChangeText={(value) => onChange({ ...draft, city: value })} /><FormInput label="标签（以英文逗号分隔）" value={draft.tags} onChangeText={(value) => onChange({ ...draft, tags: value })} /><SwitchRow label="营业中" value={draft.isOpen} onValueChange={(value) => onChange({ ...draft, isOpen: value })} /><SwitchRow label="首页推荐" value={draft.isFeatured} onValueChange={(value) => onChange({ ...draft, isFeatured: value })} /><Pressable disabled={saving} onPress={onSave} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}><Text style={styles.primaryButtonText}>{saving ? "保存中…" : "保存商户"}</Text></Pressable></ScrollView></View></View></Modal>;
}

function DealModal({ draft, merchants, onChange, onClose, onSave, saving }: { draft: DealDraft | null; merchants: any[]; onChange: (draft: DealDraft) => void; onClose: () => void; onSave: () => void; saving: boolean }) {
  const colors = useColors();
  if (!draft) return null;
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalOverlay}><View style={[styles.modalSheet, { backgroundColor: colors.background }]}><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>{draft.id ? "编辑团购" : "新增团购"}</Text><Pressable onPress={onClose}><IconSymbol name="xmark" size={20} color={colors.foreground} /></Pressable></View><ScrollView contentContainerStyle={styles.formContent}><Text style={[styles.fieldLabel, { color: colors.foreground }]}>关联商户</Text><View style={styles.categoryWrap}>{merchants.map((merchant) => <Pressable key={merchant.id} onPress={() => onChange({ ...draft, merchantId: String(merchant.id) })} style={[styles.categoryChip, { borderColor: draft.merchantId === String(merchant.id) ? colors.primary : colors.border, backgroundColor: draft.merchantId === String(merchant.id) ? colors.primary + "18" : colors.surface }]}><Text style={{ color: draft.merchantId === String(merchant.id) ? colors.primary : colors.foreground }}>{merchant.nameZh}</Text></Pressable>)}</View>{merchants.length === 0 && <Text style={[styles.recordMeta, { color: colors.error }]}>请先新增至少一名商户。</Text>}<FormInput label="中文标题" value={draft.titleZh} onChangeText={(value) => onChange({ ...draft, titleZh: value })} /><FormInput label="俄文标题" value={draft.titleRu} onChangeText={(value) => onChange({ ...draft, titleRu: value })} /><FormInput label="英文标题" value={draft.titleEn} onChangeText={(value) => onChange({ ...draft, titleEn: value })} /><FormInput label="封面图片 URL（可选）" value={draft.coverImageUrl} onChangeText={(value) => onChange({ ...draft, coverImageUrl: value })} keyboardType="url" /><FormInput label="团购价（元）" value={draft.currentPrice} onChangeText={(value) => onChange({ ...draft, currentPrice: value })} keyboardType="decimal-pad" /><FormInput label="原价（元，可选）" value={draft.originalPrice} onChangeText={(value) => onChange({ ...draft, originalPrice: value })} keyboardType="decimal-pad" /><FormInput label="已售数量" value={draft.soldCount} onChangeText={(value) => onChange({ ...draft, soldCount: value })} keyboardType="numeric" /><FormInput label="截止时间（ISO 格式，可选）" value={draft.expiresAt} onChangeText={(value) => onChange({ ...draft, expiresAt: value })} placeholder="2026-12-31T23:59:59Z" /><SwitchRow label="启用团购" value={draft.isActive} onValueChange={(value) => onChange({ ...draft, isActive: value })} /><Pressable disabled={saving || merchants.length === 0} onPress={onSave} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: saving || merchants.length === 0 ? 0.6 : 1 }]}><Text style={styles.primaryButtonText}>{saving ? "保存中…" : "保存团购"}</Text></Pressable></ScrollView></View></View></Modal>;
}

function parseTags(raw: string | null) {
  try { const value: unknown = raw ? JSON.parse(raw) : []; return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : []; } catch { return []; }
}

const styles = StyleSheet.create({
  header: { minHeight: 84, paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { color: "#FFFFFF", fontSize: 21, fontWeight: "800" }, subtitle: { color: "rgba(255,255,255,0.78)", fontSize: 12, marginTop: 4 }, refreshButton: { padding: 10 },
  nav: { flexDirection: "row", borderBottomWidth: 0.5 }, navItem: { flex: 1, alignItems: "center", paddingVertical: 14 }, navText: { fontSize: 14, fontWeight: "700" },
  page: { padding: 20, gap: 12, flexGrow: 1 }, pageTitle: { fontSize: 24, fontWeight: "800" }, pageHint: { fontSize: 13, lineHeight: 20, marginTop: 5 }, titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  actionButton: { flexDirection: "row", gap: 6, alignItems: "center", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }, actionButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 }, statCard: { width: "47%", minHeight: 126, borderWidth: 0.5, borderRadius: 16, padding: 16, justifyContent: "space-between" }, statValue: { fontSize: 30, fontWeight: "800" }, statLabel: { fontSize: 13 },
  recordCard: { borderWidth: 0.5, borderRadius: 14, padding: 14, gap: 12 }, recordTop: { flexDirection: "row", gap: 12 }, recordGrow: { flex: 1 }, recordTitle: { fontSize: 16, fontWeight: "700" }, recordMeta: { fontSize: 12, lineHeight: 18, marginTop: 3 }, badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" }, badgeText: { fontSize: 11, fontWeight: "700" }, rowActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 }, rowButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 }, rowButtonText: { fontSize: 12, fontWeight: "700" },
  emptyState: { paddingVertical: 60, alignItems: "center", gap: 12 }, emptyText: { fontSize: 14, textAlign: "center" }, notice: { marginHorizontal: 20, marginTop: 12, borderWidth: 0.5, borderRadius: 10, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, noticeText: { flex: 1, fontSize: 13, lineHeight: 19 },
  accessCard: { maxWidth: 420, borderRadius: 20, borderWidth: 0.5, padding: 24, gap: 14, alignItems: "flex-start" }, accessTitle: { fontSize: 22, fontWeight: "800" }, accessText: { fontSize: 14, lineHeight: 21 }, primaryButton: { minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 12, paddingHorizontal: 18, marginTop: 4 }, primaryButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 }, secondaryButton: { minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, paddingHorizontal: 18, borderWidth: 1, marginTop: 4 }, secondaryButtonText: { fontWeight: "700", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 35, 55, 0.48)", justifyContent: "flex-end" }, modalSheet: { maxHeight: "92%", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" }, modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 }, modalTitle: { fontSize: 19, fontWeight: "800" }, formContent: { paddingHorizontal: 20, paddingBottom: 36, gap: 12 }, field: { gap: 6 }, fieldLabel: { fontSize: 13, fontWeight: "700" }, input: { minHeight: 44, borderRadius: 10, borderWidth: 0.5, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 }, textarea: { minHeight: 84, textAlignVertical: "top" }, categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, categoryChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 }, switchRow: { borderTopWidth: 0.5, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
