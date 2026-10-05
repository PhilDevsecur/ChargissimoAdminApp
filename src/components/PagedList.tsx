import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Searchbar, Text } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { errorMessage } from '@/api/client';
import type { PageQuery } from '@/api';
import type { Page } from '@/types';
import { Banner } from '@/components/Banner';
import { useLiveEvent } from '@/realtime/useLiveEvent';
import { colors } from '@/theme';

interface Props<T> {
  fetchPage: (q: PageQuery) => Promise<Page<T>>;
  keyOf: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  searchPlaceholder: string;
  emptyText: string;
  /** Canal Pusher (`orders`, `customers`…) : la liste se recharge sur create/update/delete. */
  liveChannel?: string;
}

const DEBOUNCE_MS = 350;

/**
 * Liste paginée par CURSEUR avec recherche CÔTÉ SERVEUR (pages de 50).
 *
 * Jamais de chargement complet : les tables des commandes et des clients grossissent sans
 * limite — intenable en 4G.
 *
 * ⚠️ Réponses concurrentes : seule la DERNIÈRE recherche lancée a le droit d'écrire
 * (compteur `requestId`), sinon une réponse lente d'une frappe précédente écraserait
 * le résultat de la frappe suivante.
 */
export function PagedList<T>({ fetchPage, keyOf, renderItem, searchPlaceholder, emptyText, liveChannel }: Props<T>) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [lastId, setLastId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const searchRef = useRef(search);
  searchRef.current = search;

  const loadFirst = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
      const id = ++requestId.current;
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      try {
        const page = await fetchPage({ search: searchRef.current });
        if (id !== requestId.current) return;
        setItems(page.items);
        setHasMore(page.hasMore);
        setLastId(page.lastId);
        setError(null);
      } catch (e) {
        if (id === requestId.current) setError(errorMessage(e, 'Chargement impossible.'));
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [fetchPage],
  );

  const loadMore = async () => {
    if (!hasMore || loadingMore || loading) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const page = await fetchPage({ search: searchRef.current, lastId });
      if (id !== requestId.current) return;
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      setLastId(page.lastId);
    } catch (e) {
      if (id === requestId.current) setError(errorMessage(e, 'Chargement impossible.'));
    } finally {
      setLoadingMore(false);
    }
  };

  // Recherche : relance après une courte pause de frappe.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => loadFirst('initial'), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search, loadFirst]);

  // Retour sur l'écran (après une fiche) : rechargement silencieux de la 1re page.
  const mounted = useRef(false);
  useFocusEffect(
    useCallback(() => {
      loadFirst(mounted.current ? 'silent' : 'initial');
      mounted.current = true;
    }, [loadFirst]),
  );

  // Temps réel : canaux Pusher publics du site. Jamais de polling.
  const onLive = useCallback(() => loadFirst('silent'), [loadFirst]);
  useLiveEvent(liveChannel ?? '', 'create', liveChannel ? onLive : noop);
  useLiveEvent(liveChannel ?? '', 'update', liveChannel ? onLive : noop);

  return (
    <View style={{ flex: 1 }}>
      <Searchbar
        placeholder={searchPlaceholder}
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.search}
        inputStyle={{ minHeight: 0 }}
      />
      {error ? (
        <View style={{ paddingHorizontal: 12 }}>
          <Banner tone="error" message={error} action={{ label: 'Réessayer', onPress: () => loadFirst('initial') }} />
        </View>
      ) : null}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyOf}
          renderItem={({ item }) => renderItem(item)}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFirst('refresh')} />}
          ListEmptyComponent={!error ? <Text style={styles.empty}>{emptyText}</Text> : null}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={colors.primary} /> : null}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const noop = () => {};

const styles = StyleSheet.create({
  search: { margin: 12, marginBottom: 4, height: 44, backgroundColor: '#fff' },
  empty: { textAlign: 'center', color: colors.greyText, marginTop: 32, paddingHorizontal: 24 },
});
