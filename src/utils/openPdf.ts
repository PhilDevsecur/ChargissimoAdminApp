import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { API_BASE, apiClient } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';

/**
 * Télécharge un PDF de /api/mobile-admin dans le cache puis l'ouvre avec la visionneuse
 * du système (aperçu iOS / application PDF Android, d'où l'on peut aussi l'envoyer ou
 * l'imprimer). Le serveur régénère le PDF à chaque appel : quelques secondes.
 *
 * Le téléchargement ne passe pas par axios (fichier binaire écrit sur le disque) : si le
 * jeton d'accès a expiré, on déclenche le renouvellement via un appel axios puis on
 * réessaie une fois.
 */
export async function openPdf(path: string, fileName: string): Promise<void> {
  const target = `${FileSystem.cacheDirectory}${fileName.replace(/[^\w.-]/g, '_')}`;
  const download = () =>
    FileSystem.downloadAsync(`${API_BASE}${path}`, target, {
      headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ''}` },
    });

  let result = await download();
  if (result.status === 401) {
    await apiClient.get('/auth/me'); // renouvelle le jeton (intercepteur) ou lève
    result = await download();
  }
  if (result.status !== 200) {
    await FileSystem.deleteAsync(target, { idempotent: true }).catch(() => {});
    throw new Error(`Génération du PDF impossible (${result.status}).`);
  }
  await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: fileName });
}
