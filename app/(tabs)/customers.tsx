import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { customersApi } from '@/api';
import { PagedList } from '@/components/PagedList';
import { Pill } from '@/components/Pill';
import { colors } from '@/theme';
import type { CustomerRow } from '@/types';

/**
 * Clients : recherche SERVEUR (société, n° client, nom du contact, email, ville, CP,
 * SIRET, téléphone) par pages de 50. Jamais la liste complète.
 */
export default function CustomersScreen() {
  const router = useRouter();
  return (
    <PagedList<CustomerRow>
      fetchPage={customersApi.list}
      keyOf={(c) => String(c.idCustomers)}
      searchPlaceholder="Société, n° client, nom, ville, téléphone…"
      emptyText="Aucun client trouvé."
      liveChannel="customers"
      renderItem={(c) => (
        <TouchableRipple onPress={() => router.push(`/customer/${c.idCustomers}`)} style={[styles.row, c.debtor && styles.debtor]}>
          <View>
            <View style={styles.line}>
              <Text style={styles.company} numberOfLines={1}>
                {c.companyOrFullName || c.contactName || `Client #${c.idCustomers}`}
              </Text>
              <Text style={styles.num}>n° {c.numClient}</Text>
            </View>
            <Text style={styles.sub} numberOfLines={1}>
              {[c.contactName, [c.postalCode, c.city].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}
            </Text>
            <View style={styles.pills}>
              {!c.isClient ? <Pill label="Prospect" color={colors.greyText} solid={false} /> : null}
              {c.blocked ? <Pill label="Bloqué en compta" color="#dc2626" /> : null}
              {c.debtor ? <Pill label="Retard de paiement" color={colors.warning} solid={false} /> : null}
            </View>
          </View>
        </TouchableRipple>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 10, padding: 12 },
  debtor: { backgroundColor: '#fbf8d0' },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  company: { fontWeight: '700', color: colors.text, flex: 1 },
  num: { color: colors.greyText, fontSize: 12 },
  sub: { color: colors.greyText, fontSize: 12, marginTop: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap' },
});
