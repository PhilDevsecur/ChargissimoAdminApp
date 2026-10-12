import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text, TouchableRipple } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { chatApi } from '@/api';
import { errorMessage } from '@/api/client';
import { Banner } from '@/components/Banner';
import { useLiveEvent } from '@/realtime/useLiveEvent';
import { formatRelative } from '@/utils/format';
import { colors } from '@/theme';
import { chatTitle } from '@/utils/chat';
import type { ChatConversation } from '@/types';

/** Conversations du chat du site, ouvertes par la bulle en haut à droite. Temps réel : canal Pusher `chat`. */
export default function MessagesScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [items, setItems] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent' = 'silent') => {
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      try {
        setItems(await chatApi.list(status));
        setError(null);
      } catch (e) {
        setError(errorMessage(e, 'Chargement impossible.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status],
  );

  useFocusEffect(
    useCallback(() => {
      load('initial');
    }, [load]),
  );
  useLiveEvent('chat', 'message', load);
  useLiveEvent('chat', 'read', load);
  useLiveEvent('chat', 'status', load);

  return (
    <View style={{ flex: 1 }}>
      <SegmentedButtons
        value={status}
        onValueChange={(v) => setStatus(v as 'open' | 'closed')}
        style={{ margin: 12 }}
        buttons={[
          { value: 'open', label: 'En cours' },
          { value: 'closed', label: 'Fermées' },
        ]}
      />
      {error ? (
        <View style={{ paddingHorizontal: 12 }}>
          <Banner tone="error" message={error} action={{ label: 'Réessayer', onPress: () => load('initial') }} />
        </View>
      ) : null}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => String(c.idChatConversations)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} />}
          ListEmptyComponent={
            !error ? (
              <Text style={styles.empty}>{status === 'open' ? 'Aucune conversation en cours.' : 'Aucune conversation fermée.'}</Text>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item: c }) => {
            const unread = c.unreadCount ?? 0;
            return (
              <TouchableRipple onPress={() => router.push(`/conversation/${c.idChatConversations}`)} style={styles.row}>
                <View>
                  <View style={styles.line}>
                    <Text style={[styles.title, unread > 0 && styles.titleUnread]} numberOfLines={1}>
                      {chatTitle(c)}
                    </Text>
                    <Text style={styles.sub}>{formatRelative(c.lastMessageAt)}</Text>
                  </View>
                  <View style={styles.line}>
                    <Text style={[styles.preview, unread > 0 && styles.previewUnread]} numberOfLines={2}>
                      {c.lastMessageSender === 'admin' ? 'Vous : ' : ''}
                      {c.lastMessageText}
                    </Text>
                    {unread > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                      </View>
                    ) : null}
                  </View>
                  {c.numClient || (c.visitorCompany && c.visitorName) ? (
                    <Text style={styles.sub} numberOfLines={1}>
                      {[c.numClient ? `Client n° ${c.numClient}` : null, c.visitorCompany ? c.visitorName : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  ) : null}
                </View>
              </TouchableRipple>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 10, padding: 12 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontWeight: '600', color: colors.text, flex: 1 },
  titleUnread: { fontWeight: '800' },
  preview: { color: colors.greyText, marginTop: 4, flex: 1 },
  previewUnread: { color: colors.text, fontWeight: '600' },
  sub: { color: colors.greyText, fontSize: 12, marginTop: 2 },
  badge: { backgroundColor: colors.accent, borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.greyText, marginTop: 32 },
});
