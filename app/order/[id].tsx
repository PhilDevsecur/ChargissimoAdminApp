import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ordersApi, pdfPaths } from '@/api';
import { errorMessage } from '@/api/client';
import { Banner } from '@/components/Banner';
import { Pill, invoiceStatusColors } from '@/components/Pill';
import { InfoRow, LinkRow, Section } from '@/components/Section';
import { openPdf } from '@/utils/openPdf';
import { htmlToText } from '@/utils/html';
import { formatDate, formatDateTime, formatMoney } from '@/utils/format';
import { colors } from '@/theme';
import type { Address, OrderDetail } from '@/types';

const addressText = (a: Address | null) =>
  a ? [a.company || a.fullName, a.address, a.addressNext, [a.postalCode, a.city].filter(Boolean).join(' '), a.country].filter(Boolean).join('\n') : '';

/** Fiche commande — LECTURE SEULE. */
export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idOrders = Number(id);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOrder(await ordersApi.get(idOrders));
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Chargement impossible.'));
    } finally {
      setRefreshing(false);
    }
  }, [idOrders]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pdf = async (key: string, path: string, fileName: string) => {
    setPdfBusy(key);
    try {
      await openPdf(path, fileName);
    } catch (e) {
      setError(errorMessage(e, 'Ouverture du PDF impossible.'));
    } finally {
      setPdfBusy(null);
    }
  };

  if (!order) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        {error ? <Banner tone="error" message={error} action={{ label: 'Réessayer', onPress: load }} /> : <ActivityIndicator color={colors.primary} />}
      </View>
    );
  }

  const title = order.type === 'creditNote' ? 'Avoir' : order.numCommande || 'Commande';
  const alert = htmlToText(order.customer.alertMessage);
  const badPayer = htmlToText(order.customer.badPayerWarning);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <Stack.Screen options={{ title }} />
      {error ? <Banner tone="error" message={error} /> : null}
      {badPayer ? <Banner tone="error" title="Warning BL" message={badPayer} /> : null}
      {alert ? <Banner tone="warning" title="Info BL" message={alert} /> : null}

      <View style={{ height: 12 }} />
      <Section title={order.customer.companyOrFullName || 'Client'}>
        <InfoRow label="N° client" value={order.customer.numClient} />
        <InfoRow label="Contact" value={order.customer.contactName} />
        <Button mode="text" compact icon="account-details" style={{ alignSelf: 'flex-start', marginTop: 4 }}
          onPress={() => router.push(`/customer/${order.customer.idCustomers}`)}>
          Fiche client
        </Button>
      </Section>

      <Section title="Commande">
        <InfoRow label="Date" value={formatDateTime(order.createdAt)} />
        <InfoRow label="N° commande" value={order.numCommande} />
        <InfoRow label="Réf. client" value={order.refCdeClient} />
        <InfoRow label="Origine" value={order.platformLabel} />
        <InfoRow label="Saisi par" value={order.entryBy} />
        <Divider style={{ marginVertical: 8 }} />
        <InfoRow label="Total HT" value={formatMoney(order.totalHT)} />
        {order.totalDiscount ? <InfoRow label="Remise" value={formatMoney(-Math.abs(order.totalDiscount))} /> : null}
        <InfoRow label="Port" value={formatMoney(order.totalShipping)} />
        <InfoRow label="Total HT final" value={formatMoney(order.totalHTFinal)} />
        <InfoRow label="TVA" value={formatMoney(order.totalTVA)} />
        <InfoRow label="Total TTC" value={formatMoney(order.totalTTC)} />
        <View style={styles.buttons}>
          {order.type === 'order' ? (
            <Button mode="outlined" icon="file-pdf-box" loading={pdfBusy === 'po'} disabled={!!pdfBusy}
              onPress={() => pdf('po', pdfPaths.purchaseOrder(order.idOrders), `${order.numCommande || `commande-${order.idOrders}`}.pdf`)}>
              Bon de commande
            </Button>
          ) : null}
        </View>
      </Section>

      <Section title={`Lignes (${order.lines.length})`}>
        {order.lines.map((l, i) => (
          <View key={l.idOrderLines ?? i} style={[styles.lineRow, i > 0 && styles.lineSep]}>
            <View style={styles.lineHead}>
              <Text style={styles.ref}>{l.reference}</Text>
              <Text style={styles.lineTotal}>{formatMoney((l.qty ?? 0) * (l.price ?? 0))}</Text>
            </View>
            <Text style={styles.label}>{htmlToText(l.label)}</Text>
            <Text style={styles.sub}>
              {l.qty} × {formatMoney(l.price)}
              {l.discountRate ? ` · remise ${l.discountRate} %` : l.discountAmount ? ` · remise ${formatMoney(l.discountAmount)}` : ''}
            </Text>
          </View>
        ))}
      </Section>

      {order.orderAddress ? (
        <Section title="Adresse de livraison">
          <Text selectable>{addressText(order.orderAddress)}</Text>
        </Section>
      ) : null}

      {order.invoices.map((inv) => (
        <Section key={inv.idInvoices} title={inv.numFacture || inv.numBL || (inv.isMain ? 'Livraison principale' : 'Reliquat')}>
          <View style={styles.pills}>
            {inv.invoiceStatusLabel ? (
              <Pill label={inv.invoiceStatusLabel} color={invoiceStatusColors[inv.invoiceStatus ?? 0] ?? colors.greyText} />
            ) : null}
            <Pill label={inv.paymentStatusLabel} color={inv.paid ? colors.success : '#dc2626'} solid={false} />
            {!inv.isMain ? <Pill label="Reliquat" color={colors.warning} solid={false} /> : null}
          </View>
          <InfoRow label="N° BL" value={inv.numBL} />
          <InfoRow label="N° facture" value={inv.numFacture} />
          <InfoRow label="Facturée le" value={formatDate(inv.facturationDate)} />
          <InfoRow label="Échéance" value={formatDate(inv.dueDate)} />
          {inv.shippingAddress && addressText(inv.shippingAddress) !== addressText(order.orderAddress) ? (
            <InfoRow label="Livraison" value={addressText(inv.shippingAddress)} />
          ) : null}
          {inv.trackings.map((t) => (
            <LinkRow key={t} icon="truck-delivery-outline" label={`Suivi ${t}`} url={`https://www.chronopost.fr/fr/chrono_suivi_search?listeNumerosLT=${t}`} />
          ))}
          <View style={styles.buttons}>
            {inv.hasBL ? (
              <Button mode="outlined" icon="file-pdf-box" loading={pdfBusy === `bl${inv.idInvoices}`} disabled={!!pdfBusy}
                onPress={() => pdf(`bl${inv.idInvoices}`, pdfPaths.bl(inv.idInvoices), `${inv.numBL}.pdf`)}>
                BL
              </Button>
            ) : null}
            {inv.hasInvoice ? (
              <Button mode="outlined" icon="file-pdf-box" loading={pdfBusy === `inv${inv.idInvoices}`} disabled={!!pdfBusy}
                onPress={() => pdf(`inv${inv.idInvoices}`, pdfPaths.invoice(inv.idInvoices), `${inv.numFacture}.pdf`)}>
                {order.type === 'creditNote' ? 'Avoir' : 'Facture'}
              </Button>
            ) : null}
          </View>
        </Section>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  lineRow: { paddingVertical: 8 },
  lineSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.greyBorder },
  lineHead: { flexDirection: 'row', justifyContent: 'space-between' },
  ref: { fontWeight: '700', color: colors.text },
  lineTotal: { fontWeight: '700', color: colors.text },
  label: { color: colors.text, marginTop: 2 },
  sub: { color: colors.greyText, fontSize: 12, marginTop: 2 },
});
