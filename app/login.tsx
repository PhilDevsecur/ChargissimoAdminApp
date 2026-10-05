import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '@/api';
import { errorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme';
import { env } from '@/config/env';
import { FormScroll } from '@/components/FormScroll';

export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!login.trim() || !password) {
      setError('Identifiant et mot de passe requis.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = await authApi.login(login.trim(), password);
      await setSession(session); // AuthGate redirige vers les onglets
    } catch (e) {
      setError(errorMessage(e, 'Connexion impossible.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FormScroll contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Chargissimo Admin
        </Text>
        <Text style={styles.subtitle}>Commandes et clients</Text>

        <View style={styles.card}>
          <TextInput
            label="Identifiant admin"
            mode="outlined"
            value={login}
            onChangeText={setLogin}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            autoComplete="username"
          />
          <TextInput
            label="Mot de passe"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="password"
            autoComplete="password"
            style={{ marginTop: 12 }}
            onSubmitEditing={submit}
            right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword((v) => !v)} />}
          />
          <HelperText type="info" visible>
            Identifiant administrateur Batsecur (pas l'email).
          </HelperText>
          {error ? <HelperText type="error">{error}</HelperText> : null}
          <Button mode="contained" onPress={submit} loading={loading} disabled={loading} style={{ marginTop: 8 }}>
            Se connecter
          </Button>
        </View>
        {env.IS_DEV ? <Text style={styles.server}>Serveur : {env.API_URL}</Text> : null}
      </FormScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryDark },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#c8d0da', textAlign: 'center', marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 18 },
  server: { color: '#9aa7b6', textAlign: 'center', marginTop: 16, fontSize: 12 },
});
