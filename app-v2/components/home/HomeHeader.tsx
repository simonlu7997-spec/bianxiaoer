import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useI18n, LANGUAGES, type Language } from "@/lib/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HomeHeaderProps {
  city?: string;
  onLocationPress?: () => void;
  onSearchPress?: () => void;
  onSearchSubmit?: (text: string) => void;
}

export function HomeHeader({ city, onLocationPress, onSearchPress, onSearchSubmit }: HomeHeaderProps) {
  const { t, language, setLanguage } = useI18n();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [showLangModal, setShowLangModal] = useState(false);

  const displayCity = city || t.locating;

  return (
    <>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 8 },
        ]}
      >
        {/* Location row */}
        <View style={styles.locationRow}>
          <Pressable style={styles.locationBtn} onPress={onLocationPress}>
            <IconSymbol name="location.fill" size={16} color="#FFFFFF" />
            <Text style={styles.cityText} numberOfLines={1}>{displayCity}</Text>
            <IconSymbol name="chevron.right" size={14} color="rgba(255,255,255,0.7)" />
          </Pressable>

          {/* Language switcher */}
          <Pressable
            style={styles.langBtn}
            onPress={() => setShowLangModal(true)}
          >
            <Text style={styles.langText}>
              {LANGUAGES.find((l) => l.code === language)?.nativeLabel ?? "中"}
            </Text>
          </Pressable>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchPlaceholder}
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={() => onSearchSubmit?.(searchText)}
              returnKeyType="search"
              onFocus={onSearchPress}
            />
          </View>
          <Pressable style={styles.qrBtn} onPress={() => {}}>
            <IconSymbol name="qrcode.viewfinder" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Language selection modal */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLangModal(false)}
        >
          <View style={styles.langModal}>
            <Text style={styles.langModalTitle}>选择语言 / Language</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  language === lang.code && styles.langOptionActive,
                ]}
                onPress={() => {
                  setLanguage(lang.code as Language);
                  setShowLangModal(false);
                }}
              >
                <Text
                  style={[
                    styles.langOptionText,
                    language === lang.code && styles.langOptionTextActive,
                  ]}
                >
                  {lang.label}
                </Text>
                {language === lang.code && (
                  <IconSymbol name="checkmark" size={16} color="#1A6FB5" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A6FB5",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  cityText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    maxWidth: 200,
  },
  langBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  langText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A2E",
    padding: 0,
    margin: 0,
  },
  qrBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  langModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: 240,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  langModalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 16,
    textAlign: "center",
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  langOptionActive: {
    backgroundColor: "#E6F2FF",
  },
  langOptionText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  langOptionTextActive: {
    color: "#1A6FB5",
    fontWeight: "700",
  },
});
