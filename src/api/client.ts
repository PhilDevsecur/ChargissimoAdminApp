import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/authStore';
import type { AuthSession } from '@/types';

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/** Toutes les routes vivent sous /api/mobile-admin (backend : src/routes/api/mobileAdminRoute.js). */
export const API_BASE = `${env.API_URL}/api/mobile-admin`;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

/**
 * Un seul refresh à la fois : les requêtes qui se prennent un 401 en même temps
 * attendent toutes la même promesse (sinon N-1 refresh échoueraient).
 */
let refreshPromise: Promise<AuthSession | null> | null = null;

const runRefresh = async (): Promise<AuthSession | null> => {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<AuthSession>(
      `${API_BASE}/auth/refresh`,
      { refreshToken },
      { timeout: 15000, headers: { 'Content-Type': 'application/json' } },
    );
    await useAuthStore.getState().setSession(data);
    return data;
  } catch (e) {
    // Déconnexion seulement si le serveur REFUSE (401) : une coupure réseau ne doit
    // pas déconnecter l'utilisateur.
    if ((e as AxiosError)?.response?.status === 401) await useAuthStore.getState().clearAuth();
    return null;
  }
};

apiClient.interceptors.response.use(
  (response) => {
    // Les handlers repris tels quels de l'API du framework répondent
    // { error:false, data:{...} } (req.sendApiSuccess) : on déballe pour que l'app voie
    // toujours l'objet utile.
    const body = response.data;
    if (body && typeof body === 'object' && body.error === false && 'data' in body) {
      response.data = body.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');
    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      refreshPromise = refreshPromise ?? runRefresh();
      const session = await refreshPromise;
      refreshPromise = null;
      if (session) {
        original.headers.set('Authorization', `Bearer ${session.accessToken}`);
        return apiClient.request(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Message d'erreur lisible, quelle que soit la forme renvoyée par le backend. */
export const errorMessage = (e: unknown, fallback = 'Une erreur est survenue.'): string => {
  const ax = e as AxiosError<{ error?: string | boolean; errors?: string[]; message?: string }>;
  if (ax?.code === 'ECONNABORTED' || ax?.message === 'Network Error') {
    return 'Serveur injoignable. Vérifiez la connexion.';
  }
  const data = ax?.response?.data;
  if (data?.errors?.length) return data.errors.join('\n');
  if (typeof data?.error === 'string') return data.error;
  return data?.message ?? fallback;
};
