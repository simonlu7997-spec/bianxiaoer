import AsyncStorage from "@react-native-async-storage/async-storage";
import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
};

/**
 * 本地认证存储（v2 本地适配版）
 *
 * 背景：GitHub 完整版用 expo-secure-store 存储会话，本地无后端；
 * 且 expo-secure-store 在 iOS 26 上存在兼容问题（TurboModule 抛 NSException 导致启动崩溃）。
 * 改为 AsyncStorage 存储（本地模拟登录足够），规避 iOS 26 keychain 问题。
 */

async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.error("[Auth] getItem failed:", e);
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.error("[Auth] setItem failed:", e);
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error("[Auth] removeItem failed:", e);
  }
}

export async function getSessionToken(): Promise<string | null> {
  try {
    console.log("[Auth] Getting session token...");
    const token = await getItem(SESSION_TOKEN_KEY);
    console.log(
      "[Auth] Session token:",
      token ? `present (${token.substring(0, 20)}...)` : "missing",
    );
    return token;
  } catch (error) {
    console.error("[Auth] Failed to get session token:", error);
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  try {
    console.log("[Auth] Setting session token...", token.substring(0, 20) + "...");
    await setItem(SESSION_TOKEN_KEY, token);
    console.log("[Auth] Session token stored successfully");
  } catch (error) {
    console.error("[Auth] Failed to set session token:", error);
    throw error;
  }
}

export async function removeSessionToken(): Promise<void> {
  try {
    console.log("[Auth] Removing session token...");
    await removeItem(SESSION_TOKEN_KEY);
    console.log("[Auth] Session token removed");
  } catch (error) {
    console.error("[Auth] Failed to remove session token:", error);
  }
}

export async function getUserInfo(): Promise<User | null> {
  try {
    console.log("[Auth] Getting user info...");
    const info = await getItem(USER_INFO_KEY);
    if (!info) {
      console.log("[Auth] No user info found");
      return null;
    }
    const user = JSON.parse(info) as User;
    console.log("[Auth] User info retrieved:", user);
    return user;
  } catch (error) {
    console.error("[Auth] Failed to get user info:", error);
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  try {
    console.log("[Auth] Setting user info...", user);
    await setItem(USER_INFO_KEY, JSON.stringify(user));
    console.log("[Auth] User info stored successfully");
  } catch (error) {
    console.error("[Auth] Failed to set user info:", error);
  }
}

export async function clearUserInfo(): Promise<void> {
  try {
    console.log("[Auth] Clearing user info...");
    await removeItem(USER_INFO_KEY);
  } catch (error) {
    console.error("[Auth] Failed to clear user info:", error);
  }
}
