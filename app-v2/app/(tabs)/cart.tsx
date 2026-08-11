import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import { useCart, CartItem } from "@/lib/cart-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

// ─── Cart Item Row ────────────────────────────────────────────────────────────
function CartItemRow({
  item,
  onToggle,
  onUpdateQty,
  onRemove,
}: {
  item: CartItem;
  onToggle: () => void;
  onUpdateQty: (qty: number) => void;
  onRemove: () => void;
}) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.itemRow,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      <Pressable
        style={[
          styles.checkbox,
          {
            borderColor: item.checked ? colors.primary : colors.border,
            backgroundColor: item.checked ? colors.primary : "transparent",
          },
        ]}
        onPress={onToggle}
      >
        {item.checked && <IconSymbol name="checkmark" size={12} color="#fff" />}
      </Pressable>

      <Image
        source={{ uri: item.imageUrl }}
        style={styles.itemImage}
        contentFit="cover"
      />

      <View style={styles.itemInfo}>
        <Text
          style={[styles.itemName, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {item.spec ? (
          <View style={[styles.specBadge, { backgroundColor: colors.border }]}>
            <Text style={[styles.specText, { color: colors.muted }]}>
              {item.spec}
            </Text>
          </View>
        ) : null}
        <View style={styles.itemBottom}>
          <Text style={[styles.itemPrice, { color: colors.primary }]}>
            ¥{item.price.toFixed(2)}
          </Text>
          <View style={[styles.qtyRow, { borderColor: colors.border }]}>
            <Pressable
              style={[styles.qtyBtn, { borderColor: colors.border }]}
              onPress={() => {
                if (Platform.OS !== "web")
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (item.quantity <= 1) {
                  onRemove();
                } else {
                  onUpdateQty(item.quantity - 1);
                }
              }}
            >
              <Text style={[styles.qtyBtnText, { color: colors.foreground }]}>
                {item.quantity <= 1 ? "🗑" : "−"}
              </Text>
            </Pressable>
            <Text style={[styles.qtyNum, { color: colors.foreground }]}>
              {item.quantity}
            </Text>
            <Pressable
              style={[styles.qtyBtn, { borderColor: colors.border }]}
              onPress={() => {
                if (Platform.OS !== "web")
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onUpdateQty(item.quantity + 1);
              }}
            >
              <Text style={[styles.qtyBtnText, { color: colors.primary }]}>
                +
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────
function CheckoutModal({
  visible,
  onClose,
  onConfirm,
  total,
  itemCount,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  total: number;
  itemCount: number;
}) {
  const colors = useColors();
  const { t } = useI18n();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalSheet, { backgroundColor: colors.surface }]}
        >
          <View
            style={[styles.modalHandle, { backgroundColor: colors.border }]}
          />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {t.cartCheckoutTitle}
          </Text>

          <View
            style={[
              styles.summaryBox,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>
                {t.cartSelected} {itemCount} {t.cartItems}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                ¥{total.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={[styles.paymentNotice, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <IconSymbol name="clock.fill" size={18} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.paymentNoticeTitle, { color: colors.foreground }]}>订单将以“待支付”状态创建</Text>
              <Text style={[styles.paymentNoticeText, { color: colors.muted }]}>支付宝和微信支付尚未开通，当前不会扣款或模拟支付成功。</Text>
            </View>
          </View>

          <Pressable
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmBtnText}>
              创建待支付订单 ¥{total.toFixed(2)}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Cart Screen ──────────────────────────────────────────────────────────────
export default function CartScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const {
    items,
    checkedCount,
    checkedTotal,
    allChecked,
    removeItem,
    updateQty,
    toggleCheck,
    toggleAll,
    removeChecked,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const createOrder = trpc.user.orders.create.useMutation();

  const [checkoutVisible, setCheckoutVisible] = useState(false);

  const handleRemove = useCallback(
    (id: string) => {
      if (Platform.OS !== "web") {
        Alert.alert(t.cartDelete, t.cartDeleteConfirm, [
          { text: t.cancel, style: "cancel" },
          {
            text: t.cartDelete,
            style: "destructive",
            onPress: () => removeItem(id),
          },
        ]);
      } else {
        removeItem(id);
      }
    },
    [removeItem, t]
  );

  const handleCheckout = useCallback(() => {
    if (checkedCount === 0) return;
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCheckoutVisible(true);
  }, [checkedCount]);

  const handleConfirmOrder = useCallback(async () => {
    if (!isAuthenticated) {
      setCheckoutVisible(false);
      router.push("/login");
      return;
    }
    const selectedItems = items.filter((item) => item.checked);
    try {
      await createOrder.mutateAsync({ items: selectedItems.map((item) => ({ merchantId: Number(item.merchantId), title: item.spec ? `${item.name}（${item.spec}）` : item.name, priceCents: Math.round(item.price * 100), quantity: item.quantity })) });
    } catch (error) {
      Alert.alert("", error instanceof Error ? error.message : "订单创建失败，请稍后重试。");
      return;
    }
    setCheckoutVisible(false);
    removeChecked();
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("", "订单已创建，当前状态为待支付。支付渠道开通后可在此完成付款。");
    } else {
      alert("订单已创建，当前状态为待支付。支付渠道开通后可在此完成付款。");
    }
  }, [createOrder, isAuthenticated, items, removeChecked, t]);

  if (items.length === 0) {
    return (
      <ScreenContainer>
        <View style={[styles.header, { backgroundColor: "#1A6FB5" }]}>
          <Text style={styles.headerTitle}>{t.tabs.cart}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={[styles.emptyText, { color: colors.foreground }]}>
            {t.cartEmpty}
          </Text>
          <Text style={[styles.emptyHint, { color: colors.muted }]}>
            {t.cartEmptyHint}
          </Text>
          <Pressable
            style={[styles.goShoppingBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.goShoppingText}>{t.cartGoShopping}</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: "#1A6FB5" }]}>
        <Text style={styles.headerTitle}>{t.tabs.cart}</Text>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") {
              Alert.alert(t.cartDelete, t.cartClearSelected, [
                { text: t.cancel, style: "cancel" },
                {
                  text: t.cartDelete,
                  style: "destructive",
                  onPress: removeChecked,
                },
              ]);
            } else {
              removeChecked();
            }
          }}
        >
          <Text style={styles.headerAction}>{t.cartClearSelected}</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onToggle={() => toggleCheck(item.id)}
            onUpdateQty={(qty) => updateQty(item.id, qty)}
            onRemove={() => handleRemove(item.id)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Pressable
          style={styles.selectAllRow}
          onPress={() => toggleAll(!allChecked)}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: allChecked ? colors.primary : colors.border,
                backgroundColor: allChecked ? colors.primary : "transparent",
              },
            ]}
          >
            {allChecked && (
              <IconSymbol name="checkmark" size={12} color="#fff" />
            )}
          </View>
          <Text style={[styles.selectAllText, { color: colors.foreground }]}>
            {t.cartSelectAll}
          </Text>
        </Pressable>

        <View style={styles.checkoutArea}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>
              {t.cartTotal}
            </Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              ¥{checkedTotal.toFixed(2)}
            </Text>
          </View>
          <Pressable
            style={[
              styles.checkoutBtn,
              {
                backgroundColor:
                  checkedCount > 0 ? colors.primary : colors.border,
              },
            ]}
            onPress={handleCheckout}
            disabled={checkedCount === 0}
          >
            <Text style={styles.checkoutBtnText}>
              {t.cartCheckout}
              {checkedCount > 0 ? `(${checkedCount})` : ""}
            </Text>
          </Pressable>
        </View>
      </View>

      <CheckoutModal
        visible={checkoutVisible}
        onClose={() => setCheckoutVisible(false)}
        onConfirm={handleConfirmOrder}
        total={checkedTotal}
        itemCount={checkedCount}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  headerAction: { fontSize: 13, color: "rgba(255,255,255,0.85)" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 80,
  },
  emptyIcon: { fontSize: 64 },
  emptyText: { fontSize: 18, fontWeight: "600" },
  emptyHint: { fontSize: 14 },
  goShoppingBtn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  goShoppingText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  itemImage: { width: 80, height: 80, borderRadius: 8 },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  specBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  specText: { fontSize: 11 },
  itemBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  itemPrice: { fontSize: 16, fontWeight: "700" },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 0.5,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.5,
    borderLeftWidth: 0.5,
  },
  qtyBtnText: { fontSize: 16, fontWeight: "600" },
  qtyNum: { width: 32, textAlign: "center", fontSize: 14, fontWeight: "600" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    paddingBottom: 24,
  },
  selectAllRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectAllText: { fontSize: 14 },
  checkoutArea: { flexDirection: "row", alignItems: "center", gap: 16 },
  totalLabel: { fontSize: 11 },
  totalAmount: { fontSize: 18, fontWeight: "700" },
  checkoutBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 22 },
  checkoutBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  summaryBox: { borderRadius: 10, padding: 12, borderWidth: 0.5 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 16, fontWeight: "700" },
  paymentNotice: { flexDirection: "row", gap: 10, borderWidth: 0.5, borderRadius: 10, padding: 13 },
  paymentNoticeTitle: { fontSize: 14, fontWeight: "700" },
  paymentNoticeText: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  confirmBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
