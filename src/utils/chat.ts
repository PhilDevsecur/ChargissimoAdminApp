import type { ChatConversation } from '@/types';

/** Nom affiché d'une conversation : société, à défaut nom, à défaut email. */
export const chatTitle = (c: Pick<ChatConversation, 'visitorCompany' | 'visitorName' | 'visitorEmail'>) =>
  c.visitorCompany || c.visitorName || c.visitorEmail || 'Visiteur';
