import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AdminUser } from '@/types';

// Préfixe propre à l'app admin : rien de partagé avec l'site Chargissimo.
const ACCESS_KEY = 'bsadmin.accessToken';
const REFRESH_KEY = 'bsadmin.refreshToken';
const ADMIN_KEY = 'bsadmin.admin';

/**
 * Le web (`npm run web`) sert uniquement au développement : expo-secure-store n'y
 * existe pas, on retombe alors sur localStorage. Sur iOS/Android : Keychain/Keystore.
 * Le refresh-token donne accès à l'admin pendant 90 j : JAMAIS en AsyncStorage.
 */
const web = Platform.OS === 'web';

const getItem = async (key: string): Promise<string | null> => {
  if (web) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
};

const setItem = async (key: string, value: string): Promise<void> => {
  if (web) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* stockage indisponible : on continue en mémoire */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
};

const removeItem = async (key: string): Promise<void> => {
  if (web) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* idem */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key).catch(() => {});
};

export const secureStorage = {
  getAccessToken: () => getItem(ACCESS_KEY),
  getRefreshToken: () => getItem(REFRESH_KEY),
  async getAdmin(): Promise<AdminUser | null> {
    const raw = await getItem(ADMIN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AdminUser;
    } catch {
      return null;
    }
  },
  async setSession(accessToken: string, refreshToken: string, admin: AdminUser) {
    await Promise.all([
      setItem(ACCESS_KEY, accessToken),
      setItem(REFRESH_KEY, refreshToken),
      setItem(ADMIN_KEY, JSON.stringify(admin)),
    ]);
  },
  async clear() {
    await Promise.all([removeItem(ACCESS_KEY), removeItem(REFRESH_KEY), removeItem(ADMIN_KEY)]);
  },
};
