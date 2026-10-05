import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { colors } from '@/theme';

type Tone = 'info' | 'warning' | 'error' | 'success';

const TONES: Record<Tone, { bg: string; border: string; icon: string }> = {
  info: { bg: '#eef4fb', border: '#b9d2ee', icon: 'ℹ️' },
  warning: { bg: '#fff6e0', border: '#f0d79a', icon: '⚠️' },
  error: { bg: '#fdecec', border: '#f2b6b6', icon: '⛔' },
  success: { bg: '#eaf6ec', border: '#a9d7b3', icon: '✅' },
};

interface Props {
  tone?: Tone;
  title?: string;
  message: string;
  action?: { label: string; onPress: () => void };
}

/** Encart d'information réutilisé pour les messages du jour (fermeture, event bloquant, date complète…). */
export function Banner({ tone = 'info', title, message, action }: Props) {
  const palette = TONES[tone];
  return (
    <View style={[styles.container, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      {title ? (
        <Text style={styles.title}>
          {palette.icon} {title}
        </Text>
      ) : null}
      <Text style={styles.message}>{message}</Text>
      {action ? (
        <Button compact onPress={action.onPress} style={styles.action}>
          {action.label}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 8, padding: 14, marginTop: 16 },
  title: { fontWeight: '700', marginBottom: 4, color: colors.text },
  message: { color: colors.text, lineHeight: 20 },
  action: { alignSelf: 'flex-start', marginTop: 6, marginLeft: -8 },
});
