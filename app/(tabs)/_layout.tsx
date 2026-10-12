import { useCallback, useState } from 'react';
import { Tabs, useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Badge, IconButton } from 'react-native-paper';
import { View } from 'react-native';
import { chatApi } from '@/api';
import { useLiveEvent } from '@/realtime/useLiveEvent';
import { colors } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: string; size: number }) {
    return <MaterialCommunityIcons name={name} color={color} size={size} />;
  };

export default function TabsLayout() {
  const router = useRouter();

  // Bulle « Messages » (en haut à droite) : conversations du chat du site avec au moins un
  // message visiteur non lu. Rechargée à l'ouverture et sur les événements Pusher `chat`.
  const [unreadChats, setUnreadChats] = useState(0);
  const refreshChats = useCallback(() => {
    chatApi.unreadCount().then(setUnreadChats).catch(() => {});
  }, []);
  useFocusEffect(refreshChats);
  useLiveEvent('chat', 'message', refreshChats);
  useLiveEvent('chat', 'read', refreshChats);

  const messagesBubble = () => (
    <View style={{ marginRight: 4 }}>
      <IconButton
        icon="message-text"
        iconColor="#fff"
        size={26}
        accessibilityLabel={unreadChats > 0 ? `Messages, ${unreadChats} non lus` : 'Messages'}
        onPress={() => router.push('/messages')}
      />
      {unreadChats > 0 ? (
        <Badge size={18} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: colors.accent, color: '#fff' }}>
          {unreadChats > 9 ? '9+' : unreadChats}
        </Badge>
      ) : null}
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primaryDark },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerRight: messagesBubble,
        tabBarActiveTintColor: colors.primary,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Commandes', tabBarIcon: icon('package-variant-closed') }} listeners={{ focus: refreshChats }} />
      <Tabs.Screen name="customers" options={{ title: 'Clients', tabBarIcon: icon('account-group') }} listeners={{ focus: refreshChats }} />
      <Tabs.Screen name="account" options={{ title: 'Compte', tabBarIcon: icon('account-circle') }} listeners={{ focus: refreshChats }} />
    </Tabs>
  );
}
