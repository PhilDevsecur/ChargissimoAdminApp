// Projections renvoyées par /api/mobile-admin (backend : ChargissimoNodeJS,
// src/controllers/api/mobileAdmin/*). Aucune règle métier côté app : les libellés de
// statut, la présence d'un BL… sont calculés par le serveur.

export interface AdminUser {
  idUsers: number;
  login: string;
  superAdmin: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  admin: AdminUser;
}

/** Une page d'une liste paginée par curseur (le serveur renvoie `hasMore` + le curseur suivant). */
export interface Page<T> {
  items: T[];
  hasMore: boolean;
  lastId: number | null;
}

// ─── Commandes ───────────────────────────────────────────────────────
export type OrderType = 'order' | 'creditNote';

/** Une ligne du tableau des commandes = une facture/BL (comme le site). */
export interface OrderRow {
  idOrders: number;
  idInvoices: number | null;
  idCustomers: number | null;
  type: OrderType;
  createdAt: string;
  numCommande: string;
  numBLFact: string;
  refCdeClient: string;
  companyOrFullName: string;
  numClient: string;
  totalHT: number | null;
  totalTTC: number | null;
  invoiceStatus: number | null;
  invoiceStatusLabel: string | null;
  paid: boolean;
  debtor: boolean;
  platform: number | null;
  platformLabel: string | null;
}

export interface Address {
  label: string;
  company: string;
  fullName?: string;
  address: string;
  addressNext: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface OrderLine {
  idOrderLines: number;
  reference: string;
  /** HTML (désignation riche) : toujours passer par htmlToText. */
  label: string;
  qty: number | null;
  price: number | null;
  discountRate: number | null;
  discountAmount: number | null;
}

export interface OrderInvoice {
  idInvoices: number;
  isMain: boolean;
  numBL: string;
  numFacture: string;
  invoiceStatus: number | null;
  invoiceStatusLabel: string | null;
  paymentStatus: number | null;
  paymentStatusLabel: string;
  paid: boolean;
  /** Le BL existe vraiment (règle du serveur, cf. ordersController.js). */
  hasBL: boolean;
  hasInvoice: boolean;
  facturationDate: string | null;
  dueDate: string | null;
  shippingAddress: Address | null;
  trackings: string[];
}

export interface OrderDetail {
  idOrders: number;
  type: OrderType;
  createdAt: string;
  numCommande: string;
  refCdeClient: string;
  idOrdersAssociated: number | null;
  platform: number | null;
  platformLabel: string | null;
  entryBy: string;
  totalHT: number | null;
  totalDiscount: number | null;
  totalShipping: number | null;
  totalHTFinal: number | null;
  totalTVA: number | null;
  totalTTC: number | null;
  customer: {
    idCustomers: number;
    numClient: string;
    companyOrFullName: string;
    contactName: string;
    /** HTML d'éditeur riche. */
    alertMessage: string;
    badPayerWarning: string;
  };
  orderAddress: Address | null;
  lines: OrderLine[];
  invoices: OrderInvoice[];
}

// ─── Clients ─────────────────────────────────────────────────────────────────
export interface CustomerRow {
  idCustomers: number;
  numClient: string;
  /** false = prospect. */
  isClient: boolean;
  companyOrFullName: string;
  contactName: string;
  email: string;
  postalCode: string;
  city: string;
  countryCode: string;
  debtor: boolean;
  blocked: boolean;
}

export interface Phone {
  display: string;
  e164: string;
}

export interface CustomerContact {
  idContacts: number;
  isFacturationContact: boolean;
  fullName: string;
  role: string;
  email: string;
  phone: Phone | null;
  mobilePhone: Phone | null;
}

export interface CustomerDetail {
  idCustomers: number;
  numClient: string;
  isClient: boolean;
  pro: boolean;
  companyOrFullName: string;
  siret: string;
  tvaIntracom: string;
  debtor: boolean;
  blocked: boolean;
  ifPayInAdvance: boolean;
  alreadyOrdered: boolean;
  contacts: CustomerContact[];
  addresses: (Address & { idAddresses: number; facturation: boolean })[];
  /** HTML d'éditeur riche (TinyMCE) : toujours passer par htmlToText. */
  notes: { note: string; accountingNote: string; alertMessage: string; badPayerWarning: string };
}
