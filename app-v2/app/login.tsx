import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { startOAuthLogin } from "@/constants/oauth";

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const COUNTDOWN_SECONDS = 60;

export default function LoginScreen() {
  const { t, language } = useI18n();
  const colors = useColors();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [codeError, setCodeError] = useState("");

  const codeInputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSendCode = useCallback(async () => {
    if (!PHONE_REGEX.test(phone)) {
      setPhoneError(t.invalidPhone);
      return;
    }
    setPhoneError("");
    setLoading(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      // TODO: 接入短信服务后替换此处
      await new Promise((resolve) => setTimeout(resolve, 800));
      startCountdown();
      setStep("code");
      setTimeout(() => codeInputRef.current?.focus(), 300);
      Alert.alert("", t.codeSent);
    } catch {
      Alert.alert("", t.loginFailed);
    } finally {
      setLoading(false);
    }
  }, [phone, t, startCountdown]);

  const handleVerifyCode = useCallback(async () => {
    if (code.length !== 6) {
      setCodeError(t.invalidCode);
      return;
    }
    setCodeError("");
    setLoading(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      // TODO: 接入短信验证码验证接口
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace("/(tabs)");
    } catch {
      setCodeError(t.loginFailed);
    } finally {
      setLoading(false);
    }
  }, [code, t]);

  const handleOAuthLogin = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await startOAuthLogin();
    } catch {
      Alert.alert("", t.loginFailed);
    }
  }, [t]);

  const handleSkip = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  const s = styles(colors);

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Skip button */}
          <View style={s.skipRow}>
            <Pressable onPress={handleSkip} style={({ pressed }) => [s.skipBtn, pressed && { opacity: 0.6 }]}>
              <Text style={s.skipText}>{t.skipLogin}</Text>
            </Pressable>
          </View>

          {/* Logo & Title */}
          <View style={s.heroSection}>
            <View style={s.logoCircle}>
              <Text style={s.logoText}>边</Text>
            </View>
            <Text style={s.title}>{t.loginTitle}</Text>
            <Text style={s.subtitle}>{t.loginSubtitle}</Text>
          </View>

          {/* Phone Input */}
          <View style={s.formSection}>
            <Text style={s.label}>{t.phoneNumber}</Text>
            <View style={[s.inputRow, phoneError ? s.inputError : null]}>
              <Text style={s.countryCode}>+86</Text>
              <View style={s.divider} />
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={(v) => {
                  setPhone(v);
                  if (phoneError) setPhoneError("");
                }}
                placeholder={t.phoneNumberPlaceholder}
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                maxLength={11}
                returnKeyType="done"
                onSubmitEditing={step === "phone" ? handleSendCode : undefined}
                editable={step === "phone"}
              />
            </View>
            {phoneError ? <Text style={s.errorText}>{phoneError}</Text> : null}

            {/* Code Input */}
            {step === "code" && (
              <>
                <Text style={[s.label, { marginTop: 20 }]}>{t.verificationCode}</Text>
                <View style={[s.inputRow, codeError ? s.inputError : null]}>
                  <TextInput
                    ref={codeInputRef}
                    style={[s.input, { flex: 1 }]}
                    value={code}
                    onChangeText={(v) => {
                      setCode(v.replace(/\D/g, "").slice(0, 6));
                      if (codeError) setCodeError("");
                    }}
                    placeholder={t.verificationCodePlaceholder}
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyCode}
                  />
                  <Pressable
                    onPress={countdown > 0 ? undefined : handleSendCode}
                    style={({ pressed }) => [
                      s.resendBtn,
                      countdown > 0 && s.resendDisabled,
                      pressed && countdown === 0 && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={[s.resendText, countdown > 0 && s.resendTextDisabled]}>
                      {countdown > 0 ? `${countdown}${t.resendCountdown}` : t.resendCode}
                    </Text>
                  </Pressable>
                </View>
                {codeError ? <Text style={s.errorText}>{codeError}</Text> : null}
              </>
            )}

            {/* Primary Button */}
            <Pressable
              onPress={step === "phone" ? handleSendCode : handleVerifyCode}
              disabled={loading}
              style={({ pressed }) => [
                s.primaryBtn,
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
                loading && { opacity: 0.7 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.primaryBtnText}>
                  {step === "phone" ? t.getVerificationCode : t.loginWithPhone}
                </Text>
              )}
            </Pressable>

            {/* Divider */}
            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>{t.loginWithOAuth}</Text>
              <View style={s.orLine} />
            </View>

            {/* OAuth Button */}
            <Pressable
              onPress={handleOAuthLogin}
              style={({ pressed }) => [
                s.oauthBtn,
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
            >
              <IconSymbol name="person.crop.circle.fill" size={20} color={colors.primary} />
              <Text style={s.oauthBtnText}>{t.loginWithOAuth}</Text>
            </Pressable>
          </View>

          {/* Terms */}
          <View style={s.termsRow}>
            <Text style={s.termsText}>{t.agreeTerms} </Text>
            <Pressable onPress={() => Linking.openURL("https://bianxiaoer.com/terms")}>
              <Text style={s.termsLink}>{t.termsOfService}</Text>
            </Pressable>
            <Text style={s.termsText}> {language === "zh" ? "和" : "&"} </Text>
            <Pressable onPress={() => Linking.openURL("https://bianxiaoer.com/privacy")}>
              <Text style={s.termsLink}>{t.privacyPolicy}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    skipRow: {
      alignItems: "flex-end",
      paddingTop: 12,
      paddingBottom: 8,
    },
    skipBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    skipText: {
      fontSize: 14,
      color: colors.muted,
    },
    heroSection: {
      alignItems: "center",
      paddingTop: 32,
      paddingBottom: 40,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    logoText: {
      fontSize: 36,
      fontWeight: "700",
      color: "#fff",
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.muted,
    },
    formSection: {
      flex: 1,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      height: 52,
    },
    inputError: {
      borderColor: colors.error,
    },
    countryCode: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      paddingRight: 10,
    },
    divider: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
      height: "100%",
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
      marginLeft: 4,
    },
    resendBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.primary + "15",
    },
    resendDisabled: {
      backgroundColor: "transparent",
    },
    resendText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
    resendTextDisabled: {
      color: colors.muted,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    primaryBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
    },
    orRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 24,
      gap: 10,
    },
    orLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    orText: {
      fontSize: 13,
      color: colors.muted,
    },
    oauthBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 14,
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
    },
    oauthBtnText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
    },
    termsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 24,
      paddingBottom: 8,
    },
    termsText: {
      fontSize: 12,
      color: colors.muted,
    },
    termsLink: {
      fontSize: 12,
      color: colors.primary,
    },
  });
