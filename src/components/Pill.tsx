import { StyleSheet, Text, View } from 'react-native';

/**
 * Couleurs des statuts de facture/BL, alignées sur l'admin web. Le LIBELLÉ, lui,
 * vient toujours du serveur (`invoiceStatusLabel`).
 */
export const invoiceStatusColors: Record<number, string> = {
  1: '#1a56db', // saisie
  2: '#7c3aed', // en préparation
  3: '#b45309', // en attente d'expédition
  4: '#ea580c', // expédiée
  5: '#1f2937', // livrée
  9: '#b91c1c', // annulée (ancienne)
  10: '#b91c1c', // annulée
};

export function Pill({ label, color = '#4A5562', solid = true }: { label: string; color?: string; solid?: boolean }) {
  return (
    <View style={[styles.pill, solid ? { backgroundColor: color } : { borderColor: color, borderWidth: 1 }]}>
      <Text style={[styles.text, { color: solid ? '#fff' : color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 6, marginTop: 4, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700' },
});
