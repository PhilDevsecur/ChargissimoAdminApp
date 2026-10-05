import { create } from 'zustand';
import { secureStorage } from '@/utils/secureStorage';
import type { AdminUser, AuthSession } from '@/types';

interface AuthState {
  admin: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** false tant que le secure-store n'a pas été relu au démarrage. */
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,

  async hydrate() {
    const [accessToken, refreshToken, admin] = await Promise.all([
      secureStorage.getAccessToken(),
      secureStorage.getRefreshToken(),
      secureStorage.getAdmin(),
    ]);
    // L'access-token n'est pas vérifié ici : l'intercepteur axios le renouvelle au
    // premier 401 tant que le refresh-token est valide (et le compte toujours admin).
    if (refreshToken && admin) {
      set({ accessToken, refreshToken, admin, isHydrated: true });
    } else {
      await secureStorage.clear();
      set({ accessToken: null, refreshToken: null, admin: null, isHydrated: true });
    }
  },

  async setSession(session) {
    await secureStorage.setSession(session.accessToken, session.refreshToken, session.admin);
    set({ accessToken: session.accessToken, refreshToken: session.refreshToken, admin: session.admin });
  },

  async clearAuth() {
    await secureStorage.clear();
    set({ admin: null, accessToken: null, refreshToken: null });
  },
}));

export const selectIsAuthenticated = (s: AuthState) => Boolean(s.refreshToken && s.admin);
