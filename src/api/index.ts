import { apiClient } from './client';
import type { AuthSession, CustomerDetail, CustomerRow, OrderDetail, OrderRow, Page } from '@/types';

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

