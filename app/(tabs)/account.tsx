import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, List, Text } from 'react-native-paper';
import Constants from 'expo-constants';
import { authApi } from '@/api';
import { unregisterForPush } from '@/notifications/push';
import { useAuthStore } from '@/stores/authStore';
import { env } from '@/config/env';
import { colors } from '@/theme';
import { UpdateRow } from '@/components/UpdateRow';

export default function AccountScreen() {
  const admin = useAuthStore((s) => s.admin);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    await unregisterForPush(); // AVANT de jeter le jeton d'accès (route protégée)
    await authApi.logout();
    await clearAuth(); // AuthGate renvoie vers la connexion
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={styles.card}>
        <List.Item
          title={admin?.login ?? '—'}
          description={admin?.superAdmin ? 'Super admin' : 'Admin'}
          left={(p) => <List.Icon {...p} icon="account" />}
        />
        <List.Item title="Serveur" description={env.API_URL} left={(p) => <List.Icon {...p} icon="server" />} />
        <List.Item
          title="Version"
          description={Constants.expoConfig?.version ?? '—'}
          left={(p) => <List.Icon {...p} icon="information-outline" />}
        />
        <UpdateRow />
      </View>
      <Button mode="contained" icon="logout" onPress={logout} loading={busy} disabled={busy} buttonColor={colors.primaryDark}>
        Se déconnecter
      </Button>
      <Text style={styles.note}>
        Notifications : nouvelle commande d'un client (site, app iOS/Android),
        demande d'ouverture de compte. Après déconnexion, ce téléphone ne reçoit plus rien.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 16 },
  note: { color: colors.greyText, fontSize: 12, marginTop: 12, textAlign: 'center' },
});
