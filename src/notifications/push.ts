import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiClient } from '@/api/client';

/**
 * Notifications push (service Expo). Le backend (src/services/mobileAdminPush.js)
 * envoie à TOUS les téléphones admin connectés : nouvelle commande
 * d'un client (site, app iOS/Android).
 */

// App au premier plan : on affiche quand même la bannière (le serveur ne sait pas
// si l'app est ouverte).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let currentToken: string | null = null;

/**
 * Demande l'autorisation, récupère le jeton Expo du téléphone et l'enregistre côté
 * serveur. Silencieux en cas d'échec (web, simulateur, refus) : l'app fonctionne sans.
 */
export async function registerForPush(): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  try {
    if (Platform.OS === 'android') {
      // Même id que `channelId` côté serveur.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Commandes et demandes de compte',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    currentToken = token;
    await apiClient.post('/push/register', {
      token,
      platform: Platform.OS,
      deviceName: Device.deviceName ?? Device.modelName ?? null,
    });
  } catch {
    /* pas de notification sur ce téléphone, le reste de l'app fonctionne */
  }
}

/** À la déconnexion : ce téléphone ne doit plus recevoir les notifications admin. */
export async function unregisterForPush(): Promise<void> {
  if (!currentToken) return;
  await apiClient.post('/push/unregister', { token: currentToken }).catch(() => {});
  currentToken = null;
}
