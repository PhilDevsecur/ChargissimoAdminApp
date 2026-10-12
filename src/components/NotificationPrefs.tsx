import { useCallback, useState } from 'react';
import { List, Switch, Text } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { pushApi } from '@/api';
import { errorMessage } from '@/api/client';
import { getCurrentPushToken } from '@/notifications/push';
import { colors } from '@/theme';

/**
 * Réglages de notification de CE téléphone (enregistrés côté serveur avec son jeton Expo).
 * Pour l'instant un seul : les messages du chat du site — un admin qui ne traite pas le
 * chat les coupe. Si TOUS les téléphones les coupent, le serveur envoie l'email de secours
 * du chat : un message de visiteur ne reste jamais sans personne pour le voir.
 */
export function NotificationPrefs() {
  const [token, setToken] = useState<string | null>(null);
  const [chat, setChat] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      // Le jeton est obtenu au lancement (PushBridge) : il peut arriver après l'écran.
      const t = getCurrentPushToken();
      setToken(t);
      if (!t) return;
      pushApi
        .preferences(t)
        .then((p) => {
          setChat(p.chat);
          setError(null);
        })
        .catch((e) => setError(errorMessage(e, 'Réglages indisponibles.')));
    }, []),
  );

  const toggleChat = async (value: boolean) => {
    if (!token || busy) return;
    setBusy(true);
    setChat(value); // affichage immédiat, annulé si le serveur refuse
    try {
      const p = await pushApi.update(token, { chat: value });
      setChat(p.chat);
      setError(null);
    } catch (e) {
      setChat(!value);
      setError(errorMessage(e, 'Enregistrement impossible.'));
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <List.Item
        title="Notifications"
        description="Non autorisées sur ce téléphone (Réglages → Chargissimo Admin → Notifications)."
        descriptionNumberOfLines={3}
        left={(p) => <List.Icon {...p} icon="bell-off-outline" />}
      />
    );
  }

  return (
    <>
      <List.Item
        title="Messages du site"
        description={chat === false ? 'Coupées sur ce téléphone' : 'Notification à chaque message d\'un visiteur'}
        left={(p) => <List.Icon {...p} icon="message-text-outline" />}
        right={() => <Switch value={chat ?? true} onValueChange={toggleChat} disabled={busy || chat === null} color={colors.primary} />}
      />
      {error ? <Text style={{ color: colors.error, fontSize: 12, paddingHorizontal: 16, paddingBottom: 8 }}>{error}</Text> : null}
    </>
  );
}
