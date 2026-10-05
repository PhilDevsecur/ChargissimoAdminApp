import type { ReactNode } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';

/** Carte blanche titrée, utilisée par toutes les fiches. */
export function Section({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Ligne « libellé : valeur » ; masquée si la valeur est vide. */
export function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} selectable>
        {value}
      </Text>
    </View>
  );
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Ligne cliquable qui ouvre `tel:` / `mailto:` / une URL. */
export function LinkRow({ icon, label, url }: { icon: IconName; label: string; url: string }) {
  return (
    <TouchableRipple onPress={() => Linking.openURL(url).catch(() => {})} style={styles.link}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
        <Text style={styles.linkText}>{label}</Text>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontWeight: '800', color: colors.text, fontSize: 15 },
  row: { flexDirection: 'row', paddingVertical: 3 },
  label: { color: colors.greyText, width: 120 },
  value: { color: colors.text, flex: 1 },
  link: { paddingVertical: 8 },
  linkText: { color: colors.primary, marginLeft: 8, fontWeight: '600' },
});
