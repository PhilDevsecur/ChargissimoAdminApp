import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { customersApi } from '@/api';
import { errorMessage } from '@/api/client';
import { Banner } from '@/components/Banner';
import { Pill } from '@/components/Pill';
import { InfoRow, LinkRow, Section } from '@/components/Section';
import { htmlToText } from '@/utils/html';
import { prettyPhone } from '@/utils/format';
import { colors } from '@/theme';
import type { CustomerDetail } from '@/types';

/** Fiche client — LECTURE SEULE. Contacts cliquables (appel, email). */
export default function CustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idCustomers = Number(id);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setCustomer(await customersApi.get(idCustomers));
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Chargement impossible.'));
    } finally {
      setRefreshing(false);
    }
  }, [idCustomers]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!customer) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        {error ? <Banner tone="error" message={error} action={{ label: 'Réessayer', onPress: load }} /> : <ActivityIndicator color={colors.primary} />}
      </View>
    );
  }

  const notes = {
    badPayer: htmlToText(customer.notes.badPayerWarning),
    alert: htmlToText(customer.notes.alertMessage),
    note: htmlToText(customer.notes.note),
    accounting: htmlToText(customer.notes.accountingNote),
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <Stack.Screen options={{ title: customer.companyOrFullName || 'Client' }} />
      {error ? <Banner tone="error" message={error} /> : null}
      {notes.badPayer ? <Banner tone="error" title="Warning BL" message={notes.badPayer} /> : null}
      {notes.alert ? <Banner tone="warning" title="Info BL" message={notes.alert} /> : null}
      <View style={{ height: 12 }} />

      <Section title={customer.companyOrFullName}>
        <View style={styles.pills}>
          <Pill label={customer.isClient ? 'Client' : 'Prospect'} color={customer.isClient ? colors.primary : colors.greyText} solid={customer.isClient} />
          {customer.blocked ? <Pill label="Bloqué en compta" color="#dc2626" /> : null}
          {customer.debtor ? <Pill label="Retard de paiement" color={colors.warning} /> : null}
          {customer.ifPayInAdvance ? <Pill label="Paiement avant expédition" color={colors.warning} solid={false} /> : null}
        </View>
        <InfoRow label="N° client" value={customer.numClient} />
        {customer.pro ? <InfoRow label="SIRET" value={customer.siret} /> : null}
        {customer.pro ? <InfoRow label="TVA intracom." value={customer.tvaIntracom} /> : null}
      </Section>

      {customer.contacts.map((c) => (
        <Section key={c.idContacts} title={c.fullName || (c.isFacturationContact ? 'Contact de facturation' : 'Contact')}>
          {c.isFacturationContact ? <Pill label="Facturation" color={colors.primary} solid={false} /> : null}
          <InfoRow label="Poste" value={c.role} />
          {c.phone ? <LinkRow icon="phone" label={prettyPhone(c.phone.e164)} url={`tel:${c.phone.e164}`} /> : null}
          {c.mobilePhone ? <LinkRow icon="cellphone" label={prettyPhone(c.mobilePhone.e164)} url={`tel:${c.mobilePhone.e164}`} /> : null}
          {c.email ? <LinkRow icon="email-outline" label={c.email} url={`mailto:${c.email}`} /> : null}
        </Section>
      ))}

      {customer.addresses.length ? (
        <Section title="Adresses">
          {customer.addresses.map((a, i) => (
            <View key={a.idAddresses} style={[{ paddingVertical: 6 }, i > 0 && styles.sep]}>
              {a.facturation ? <Text style={styles.small}>Facturation</Text> : null}
              <Text selectable>
                {[a.company, a.address, a.addressNext, [a.postalCode, a.city].filter(Boolean).join(' '), a.country].filter(Boolean).join('\n')}
              </Text>
            </View>
          ))}
        </Section>
      ) : null}

      {notes.note ? (
        <Section title="Note">
          <Text selectable>{notes.note}</Text>
        </Section>
      ) : null}
      {notes.accounting ? (
        <Section title="Note compta">
          <Text selectable>{notes.accounting}</Text>
        </Section>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.greyBorder },
  small: { color: colors.greyText, fontSize: 12 },
});
