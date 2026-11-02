import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../api';
import { getEmotion } from '../constants/emotions';
import { confirm } from '../utils/confirm';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import TypingIndicator from '../components/TypingIndicator';
import AuraAvatar from '../components/AuraAvatar';
import Banner from '../components/Banner';
import EmptyState from '../components/EmptyState';

const SUGGESTIONS = [
  "I'm feeling stressed about work 😩",
  'Something good happened today! 🎉',
  "I can't sleep and my mind is racing",
  'I just need someone to talk to',
];

let tempId = 0;
const nextTempId = () => `temp-${++tempId}`;

export default function ChatScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const headerHeight = useHeaderHeight();
  const [conversationId, setConversationId] = useState(route.params?.conversationId || null);
  const [title, setTitle] = useState('Aura');
  const [messages, setMessages] = useState([]); // oldest first
  const [loading, setLoading] = useState(!!route.params?.conversationId);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mood, setMood] = useState(null);
  const sentInitial = useRef(false);
  const convRef = useRef(conversationId);
  convRef.current = conversationId;

  // Header: Aura avatar, live detected mood and delete button.
  useLayoutEffect(() => {
    const e = mood ? getEmotion(mood) : null;
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <AuraAvatar size={34} />
          <View style={{ marginLeft: 10, flexShrink: 1 }}>
            <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>{title}</Text>
            <Text style={[styles.headerSub, { color: e ? e.color : colors.success }]} numberOfLines={1}>
              {typing ? 'typing…' : e ? `Sensing you feel ${e.label.toLowerCase()} ${e.emoji}` : 'Here for you · online'}
            </Text>
          </View>
        </View>
      ),
      headerRight: () =>
        conversationId ? (
          <Pressable onPress={deleteConversation} hitSlop={10} style={{ paddingHorizontal: 8 }} accessibilityLabel="Delete conversation">
            <Ionicons name="trash-outline" size={21} color={colors.textMuted} />
          </Pressable>
        ) : null,
    });
    // deleteConversation reads the id from a ref, so it never goes stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, colors, title, mood, typing, conversationId]);

  const loadMessages = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await chatApi.messages(id);
      setMessages(data.messages);
      setTitle(data.conversation.title);
      const lastUser = [...data.messages].reverse().find((m) => m.role === 'user' && m.emotion);
      setMood(lastUser?.emotion || null);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (route.params?.conversationId) loadMessages(route.params.conversationId);
  }, [route.params?.conversationId, loadMessages]);

  const send = useCallback(async (text, existingTempId) => {
    const id = existingTempId || nextTempId();
    const optimistic = { id, role: 'user', content: text, created_at: new Date(), status: 'sending' };
    setMessages((prev) => (existingTempId ? prev.map((m) => (m.id === id ? optimistic : m)) : [...prev, optimistic]));
    setTyping(true);
    setError('');

    try {
      const res = await chatApi.send(text, convRef.current);
      setMessages((prev) => [...prev.filter((m) => m.id !== id), res.user_message, res.ai_message]);
      setConversationId(res.conversation.id);
      setTitle(res.conversation.title);
      setMood(res.emotion.label);
      setNotice(res.notice || '');
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'failed' } : m)));
      setError(e.message);
    } finally {
      setTyping(false);
    }
  }, []);

  // Auto-send a starter message (e.g. from Home "talk it through").
  useEffect(() => {
    const initial = route.params?.initialMessage;
    if (initial && !sentInitial.current && !route.params?.conversationId) {
      sentInitial.current = true;
      send(initial);
    }
  }, [route.params?.initialMessage, route.params?.conversationId, send]);

  const retry = useCallback((m) => send(m.content, m.id), [send]);

  async function deleteConversation() {
    const ok = await confirm({ title: 'Delete conversation?', message: 'This conversation will be permanently removed.', confirmText: 'Delete', destructive: true });
    if (!ok) return;
    try {
      await chatApi.remove(convRef.current);
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    }
  }

  const reversed = [...messages].reverse(); // inverted list: newest at the bottom
  const firstName = (user?.name || '').split(' ')[0];

  return (
    <SafeAreaView edges={['bottom']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'web' ? undefined : 'padding'} keyboardVerticalOffset={headerHeight}>
        {error || notice ? (
          <View style={styles.banners}>
            <Banner message={error} onClose={() => setError('')} />
            <Banner message={notice} type="info" onClose={() => setNotice('')} />
          </View>
        ) : null}

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : messages.length === 0 && !typing ? (
          <View style={styles.center}>
            <EmptyState
              emoji="✨"
              title={`Hi ${firstName}, I'm Aura`}
              message="How are you feeling right now? You can tell me anything — I'm here to listen."
            />
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={({ pressed }) => [styles.suggestion, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            data={reversed}
            inverted
            keyExtractor={(m) => String(m.id)}
            renderItem={({ item }) => <ChatBubble message={item} onRetry={retry} />}
            ListHeaderComponent={typing ? <TypingIndicator /> : null}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            style={styles.listView}
          />
        )}

        <View style={styles.inputWrap}>
          <ChatInput onSend={(t) => send(t)} disabled={typing || loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', maxWidth: 260 },
  headerName: { fontSize: 16, fontWeight: '800' },
  headerSub: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  banners: { paddingHorizontal: 14, paddingTop: 10 },
  list: { paddingVertical: 12, maxWidth: 820, width: '100%', alignSelf: 'center' },
  listView: { flex: 1 },
  inputWrap: { width: '100%', maxWidth: 820, alignSelf: 'center' },
  suggestions: { width: '100%', maxWidth: 480, marginTop: 4 },
  suggestion: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8 },
  suggestionText: { fontSize: 14.5 },
});
