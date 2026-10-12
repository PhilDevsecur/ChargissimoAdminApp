import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { selectIsAuthenticated, useAuthStore } from '@/stores/authStore';
import { registerForPush } from './push';

/**
 * - Enregistre le téléphone pour les notifications dès qu'une session admin existe
 *   (à la connexion ET à chaque ouverture : le jeton peut changer).
 * - Toucher une notification ouvre l'écran concerné, y compris app fermée
 *   (useLastNotificationResponse couvre le démarrage à froid).
 */
export function PushBridge() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) registerForPush();
  }, [isAuthenticated]);

  useEffect(() => {
    if (Platform.OS === 'web' || !isAuthenticated || !lastResponse) return;
    const id = lastResponse.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;

    const data = lastResponse.notification.request.content.data as
      | { type?: string; idOrders?: number; idChatConversations?: number }
      | undefined;
    if (data?.type === 'order' && data.idOrders) {
      router.push(`/order/${data.idOrders}`);
    } else if (data?.type === 'chat' && data.idChatConversations) {
      router.push(`/conversation/${data.idChatConversations}`);
    }
  }, [lastResponse, isAuthenticated, router]);

  return null;
}
