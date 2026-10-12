import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Platform, StyleSheet, TextInput, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatApi } from '@/api';
import { errorMessage } from '@/api/client';
import { Banner } from '@/components/Banner';
import { useKeyboardHeight } from '@/components/FormScroll';
import { useLiveEvent } from '@/realtime/useLiveEvent';
import { chatTitle } from '@/utils/chat';
import { formatRelative } from '@/utils/format';
import { colors } from '@/theme';
import type { ChatConversation, ChatMessage } from '@/types';

/**
 * Une conversation du chat du site. ⚠️ Répondre envoie un VRAI message au visiteur — et
 * un email s'il ne l'a pas lu au bout de 3 min. Les textes sont BRUTS : toujours <Text>.
 */
export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idChat = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [switching, setSwitching] = useState(false);

  const lastId = messages.reduce((max, m) => Math.max(max, m.idChatMessages), 0);

  const load = useCallback(async () => {
    try {
      const data = await chatApi.get(idChat);
      setConversation(data.conversation);
      setMessages(data.messages);
      setError(null);
      chatApi.markRead(idChat);
    } catch (e) {
      setError(errorMessage(e, 'Conversation introuvable.'));
    } finally {
      setLoading(false);
    }
  }, [idChat]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Signal Pusher sans contenu : on relit seulement ce qui est arrivé après le dernier message.
  const fetchNew = useCallback(async () => {
    try {
      const fresh = await chatApi.messagesAfter(idChat, lastId);
      if (!fresh.length) return;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.idChatMessages));
        return [...prev, ...fresh.filter((m) => !known.has(m.idChatMessages))];
      });
      if (fresh.some((m) => m.sender === 'visitor')) chatApi.markRead(idChat);
    } catch {
      /* nouvel essai au prochain signal */
    }
  }, [idChat, lastId]);

  useLiveEvent('chat', 'message', fetchNew);
  useLiveEvent('chat', 'status', load);

  useEffect(() => {
    if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const message = await chatApi.reply(idChat, text);
      setDraft('');
      setMessages((prev) => (prev.some((m) => m.idChatMessages === message.idChatMessages) ? prev : [...prev, message]));
      setConversation((c) => (c ? { ...c, status: 'open' } : c));
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Message non envoyé.'));
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = async () => {
    if (!conversation || switching) return;
    setSwitching(true);
    try {
      const updated = conversation.status === 'open' ? await chatApi.close(idChat) : await chatApi.reopen(idChat);
      setConversation((c) => (c ? { ...c, status: updated.status } : c));
    } catch (e) {
      setError(errorMessage(e, 'Action impossible.'));
    } finally {
      setSwitching(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />;

  return (
    <View style={[styles.screen, { paddingBottom: keyboard > 0 ? keyboard : insets.bottom }]}>
      <Stack.Screen
        options={{
          title: conversation ? chatTitle(conversation) : 'Conversation',
          headerRight: () =>
            conversation ? (
              <Button textColor="#fff" compact loading={switching} onPress={toggleStatus}>
                {conversation.status === 'open' ? 'Fermer' : 'Rouvrir'}
              </Button>
            ) : null,
        }}
      />

      {conversation ? (
        <View style={styles.info}>
          <View style={{ flex: 1 }}>
            {conversation.visitorCompany && conversation.visitorName ? (
              <Text style={styles.infoText} numberOfLines={1}>{conversation.visitorName}</Text>
            ) : null}
            {conversation.visitorEmail ? (
              <Text style={styles.link} numberOfLines={1} onPress={() => Linking.openURL(`mailto:${conversation.visitorEmail}`)}>
                {conversation.visitorEmail}
              </Text>
            ) : null}
            <Text style={styles.infoSub} numberOfLines={1}>
              {[
                conversation.numClient ? `Client n° ${conversation.numClient}` : 'Visiteur sans compte',
                conversation.pageUrl ? `depuis ${conversation.pageUrl}` : null,
                conversation.status === 'closed' ? 'Fermée' : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
          {conversation.idCustomers ? (
            <IconButton
              icon="account-details"
              iconColor={colors.primary}
              accessibilityLabel="Fiche client"
              onPress={() => router.push(`/customer/${conversation.idCustomers}`)}
            />
          ) : null}
        </View>
      ) : null}

      {error ? (
        <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
          <Banner tone="error" message={error} />
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(m) => String(m.idChatMessages)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item: m }) => {
          const team = m.sender === 'admin';
          return (
            <View style={[styles.msg, team ? styles.msgTeam : styles.msgVisitor]}>
              {team && m.adminName ? <Text style={styles.who}>{m.adminName}</Text> : null}
              <View style={[styles.bubble, team ? styles.bubbleTeam : styles.bubbleVisitor]}>
                <Text selectable style={team ? styles.textTeam : styles.textVisitor}>{m.text}</Text>
              </View>
              <Text style={styles.time}>
                {formatRelative(m.createdAt)}
                {team && m.readAt ? ' · lu' : ''}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Votre réponse…"
          placeholderTextColor={colors.greyText}
          multiline
          maxLength={2000}
        />
        <IconButton
          icon="send"
          mode="contained"
          containerColor={colors.primary}
          iconColor="#fff"
          disabled={!draft.trim() || sending}
          loading={sending}
          accessibilityLabel="Envoyer"
          onPress={send}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.greyBorder,
  },
  infoText: { color: colors.text, fontWeight: '600' },
  infoSub: { color: colors.greyText, fontSize: 12, marginTop: 2 },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  list: { padding: 12, gap: 10 },
  msg: { maxWidth: '85%' },
  msgVisitor: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  msgTeam: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  who: { fontSize: 12, color: colors.greyText, marginBottom: 2, marginHorizontal: 4 },
  bubble: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleVisitor: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  bubbleTeam: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  textVisitor: { color: colors.text },
  textTeam: { color: '#fff' },
  time: { fontSize: 11, color: colors.greyText, marginTop: 2, marginHorizontal: 4 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.greyBorder,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.greyBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    color: colors.text,
    fontSize: 15,
  },
});
