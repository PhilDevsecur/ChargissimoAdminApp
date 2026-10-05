import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { theme, colors } from '@/theme';
import { selectIsAuthenticated, useAuthStore } from '@/stores/authStore';
import { PushBridge } from '@/notifications/PushBridge';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Toute l'app est réservée aux admins : sans session, retour systématique au login. */
function AuthGate() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const onLogin = segments[0] === 'login';
    if (!isAuthenticated && !onLogin) router.replace('/login');
    else if (isAuthenticated && onLogin) router.replace('/');
  }, [isAuthenticated, segments, router]);

  return null;
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate()
      .catch(() => {})
      .finally(() => {
        setReady(true);
        SplashScreen.hideAsync().catch(() => {});
      });
  }, [hydrate]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.primaryDark },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
              headerBackTitle: 'Retour',
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="order/[id]" options={{ title: 'Commande' }} />
            <Stack.Screen name="customer/[id]" options={{ title: 'Client' }} />
          </Stack>
          <AuthGate />
          <PushBridge />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
