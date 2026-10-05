import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ordersApi } from '@/api';
import { PagedList } from '@/components/PagedList';
import { Pill, invoiceStatusColors } from '@/components/Pill';
import { formatMoney, formatRelative } from '@/utils/format';
import { colors } from '@/theme';
import type { OrderRow } from '@/types';

/**
 * Commandes : une ligne par facture/BL, les plus récentes d'abord — le MÊME tableau que
 * l'admin web (Orders.getOrdersForTable), recherche serveur sur client, n° de commande…
 */
export default function OrdersScreen() {
  const router = useRouter();
  return (
    <PagedList<OrderRow>
      fetchPage={ordersApi.list}
      keyOf={(o) => String(o.idInvoices ?? `o${o.idOrders}`)}
      searchPlaceholder="Client, n° commande, réf. client…"
      emptyText="Aucune commande."
      liveChannel="orders"
      renderItem={(o) => <OrderItem o={o} onPress={() => router.push(`/order/${o.idOrders}`)} />}
    />
  );
}

function OrderItem({ o, onPress }: { o: OrderRow; onPress: () => void }) {
  const isCreditNote = o.type === 'creditNote';
  return (
    <TouchableRipple onPress={onPress} style={[styles.row, o.debtor && styles.debtor]}>
      <View>
        <View style={styles.line}>
          <Text style={styles.company} numberOfLines={1}>
            {o.companyOrFullName || `Client #${o.idCustomers}`}
          </Text>
          <Text style={styles.amount}>{formatMoney(o.totalTTC)} TTC</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.sub} numberOfLines={1}>
            {[isCreditNote ? 'Avoir' : o.numCommande || 'Commande', o.numBLFact, o.refCdeClient && `Réf. ${o.refCdeClient}`]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Text style={styles.sub}>{formatRelative(o.createdAt)}</Text>
        </View>
        <View style={styles.pills}>
          {o.invoiceStatusLabel ? (
            <Pill label={o.invoiceStatusLabel} color={invoiceStatusColors[o.invoiceStatus ?? 0] ?? colors.greyText} />
          ) : null}
          <Pill label={o.paid ? 'Payée' : 'Non payée'} color={o.paid ? colors.success : '#dc2626'} solid={false} />
          {o.debtor ? <Pill label="Retard de paiement" color={colors.warning} solid={false} /> : null}
          {o.platformLabel ? <Pill label={o.platformLabel} color={colors.greyText} solid={false} /> : null}
        </View>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 10, padding: 12 },
  // Jaune = client en retard de paiement.
  debtor: { backgroundColor: '#fbf8d0' },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  company: { fontWeight: '700', color: colors.text, flex: 1 },
  amount: { fontWeight: '700', color: colors.text },
  sub: { color: colors.greyText, fontSize: 12, marginTop: 2, flexShrink: 1 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
});
