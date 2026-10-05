// Web (npm run web, développement uniquement) : ni expo-file-system ni expo-sharing.
// On récupère le PDF avec le jeton puis on l'ouvre dans un nouvel onglet.
// Metro choisit openPdf.ts sur iOS/Android.
import { apiClient } from '@/api/client';

export async function openPdf(path: string, _fileName: string): Promise<void> {
  const { data } = await apiClient.get<Blob>(path, { responseType: 'blob', timeout: 60000 });
  const url = URL.createObjectURL(data);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
