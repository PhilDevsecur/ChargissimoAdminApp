import { apiClient } from './client';
import type { AuthSession, ChatConversation, ChatMessage, CustomerDetail, CustomerRow, OrderDetail, OrderRow, Page } from '@/types';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  /** Identifiant admin (colonne `login`), pas l'email — comme le site. */
  login: (login: string, password: string) =>
    apiClient.post<AuthSession>('/auth/login', { login, password }).then((r) => r.data),
  logout: () => apiClient.post('/auth/logout').catch(() => {}),
  config: () =>
    apiClient.get<{ pusher: { key: string; cluster: string } | null }>('/config').then((r) => r.data),
};

/** Paramètres d'une page : recherche serveur + curseur renvoyé par la page précédente. */
export interface PageQuery {
  search?: string;
  lastId?: number | null;
}

const pageParams = ({ search, lastId }: PageQuery) => ({
  search: search?.trim() || undefined,
  lastId: lastId ?? undefined,
});

// ─── Commandes (lecture seule) ───────────────────────────────────────
export const ordersApi = {
  list: (q: PageQuery): Promise<Page<OrderRow>> =>
    apiClient
      .get<{ orders: OrderRow[]; hasMore: boolean; lastId: number | null }>('/orders', { params: pageParams(q) })
      .then(({ data }) => ({ items: data.orders, hasMore: data.hasMore, lastId: data.lastId })),
  get: (idOrders: number) => apiClient.get<{ order: OrderDetail }>(`/orders/${idOrders}`).then((r) => r.data.order),
};

/** Chemins des PDF (relatifs à /api/mobile-admin), ouverts par `openPdf`. */
export const pdfPaths = {
  purchaseOrder: (idOrders: number) => `/orders/${idOrders}/pdf/purchase-order`,
  invoice: (idInvoices: number) => `/invoices/${idInvoices}/pdf/invoice`,
  bl: (idInvoices: number) => `/invoices/${idInvoices}/pdf/bl`,
};

// ─── Clients (lecture seule) ─────────────────────────────────────────────────
export const customersApi = {
  list: (q: PageQuery): Promise<Page<CustomerRow>> =>
    apiClient
      .get<{ customers: CustomerRow[]; hasMore: boolean; lastId: number | null }>('/customers', { params: pageParams(q) })
      .then(({ data }) => ({ items: data.customers, hasMore: data.hasMore, lastId: data.lastId })),
  get: (idCustomers: number) =>
    apiClient.get<{ customer: CustomerDetail }>(`/customers/${idCustomers}`).then((r) => r.data.customer)
};

// ─── Réglages de notification de CE téléphone ────────────────────────────────
export interface PushPreferences {
  /** Messages du chat du site. */
  chat: boolean;
}

export const pushApi = {
  preferences: (token: string) =>
    apiClient.get<{ preferences: PushPreferences }>('/push/preferences', { params: { token } }).then((r) => r.data.preferences),
  update: (token: string, prefs: PushPreferences) =>
    apiClient.put<{ preferences: PushPreferences }>('/push/preferences', { token, ...prefs }).then((r) => r.data.preferences),
};

// ─── Chat du site (routeur du framework monté sur /chat) ─────────────────────
export const chatApi = {
  list: (status: 'open' | 'closed') =>
    apiClient
      .get<{ conversations: ChatConversation[] }>('/chat/conversations', { params: { status, limit: 50 } })
      .then((r) => r.data.conversations),
  /** Conversations ayant au moins un message visiteur non lu. */
  unreadCount: () =>
    apiClient.get<{ conversations: number; messages: number }>('/chat/unread-count').then((r) => r.data.conversations),
  get: (id: number) =>
    apiClient
      .get<{ conversation: ChatConversation; messages: ChatMessage[]; hasMore: boolean }>(`/chat/conversations/${id}`)
      .then((r) => r.data),
  messagesAfter: (id: number, afterId: number) =>
    apiClient
      .get<{ messages: ChatMessage[] }>(`/chat/conversations/${id}/messages`, { params: { after: afterId } })
      .then((r) => r.data.messages),
  /** ⚠️ Envoie un VRAI message au visiteur (et un email s'il ne le lit pas sous 3 min). */
  reply: (id: number, text: string) =>
    apiClient.post<{ message: ChatMessage }>(`/chat/conversations/${id}/messages`, { text }).then((r) => r.data.message),
  markRead: (id: number) => apiClient.post(`/chat/conversations/${id}/read`).catch(() => {}),
  close: (id: number) =>
    apiClient.post<{ conversation: ChatConversation }>(`/chat/conversations/${id}/close`).then((r) => r.data.conversation),
  reopen: (id: number) =>
    apiClient.post<{ conversation: ChatConversation }>(`/chat/conversations/${id}/reopen`).then((r) => r.data.conversation),
};
