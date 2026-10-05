import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: string; size: number }) {
    return <MaterialCommunityIcons name={name} color={color} size={size} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primaryDark },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Commandes', tabBarIcon: icon('package-variant-closed') }} />
      <Tabs.Screen name="customers" options={{ title: 'Clients', tabBarIcon: icon('account-group') }} />
      <Tabs.Screen name="account" options={{ title: 'Compte', tabBarIcon: icon('account-circle') }} />
    </Tabs>
  );
}
