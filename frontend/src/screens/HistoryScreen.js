import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { chatApi } from '../api';
import { confirm } from '../utils/confirm';
import ConversationCard from '../components/ConversationCard';
import EmptyState from '../components/EmptyState';
import Banner from '../components/Banner';

export default function HistoryScreen({ navigation }) {
  const { colors } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await chatApi.conversations();
      setConversations(data.conversations);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || (c.last_message || '').toLowerCase().includes(q));
  }, [conversations, query]);

  const removeOne = async (c) => {
    const ok = await confirm({ title: 'Delete conversation?', message: `"${c.title}" will be permanently removed.`, confirmText: 'Delete', destructive: true });
    if (!ok) return;
    const before = conversations;
    setConversations((list) => list.filter((x) => x.id !== c.id)); // optimistic
    try {
      await chatApi.remove(c.id);
    } catch (e) {
      setConversations(before);
      setError(e.message);
    }
  };

  const removeAll = async () => {
    const ok = await confirm({ title: 'Clear all history?', message: 'All conversations and messages will be permanently deleted.', confirmText: 'Delete all', destructive: true });
    if (!ok) return;
    try {
      await chatApi.removeAll();
      setConversations([]);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Chat history</Text>
          {conversations.length ? (
            <Pressable onPress={removeAll} style={[styles.clear, { backgroundColor: colors.danger + '18' }]} accessibilityLabel="Clear all history">
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
              <Text style={[styles.clearText, { color: colors.danger }]}>Clear all</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search conversations"
            placeholderTextColor={colors.textFaint}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <Banner message={error} onRetry={load} onClose={() => setError('')} />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(c) => String(c.id)}
            renderItem={({ item }) => (
              <ConversationCard
                conversation={item}
                onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
                onDelete={() => removeOne(item)}
              />
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            ListEmptyComponent={
              query ? (
                <EmptyState emoji="🔍" title="No matches" message="Try a different search term." />
              ) : (
                <EmptyState
                  emoji="💬"
                  title="No conversations yet"
                  message="Start chatting with Aura and your conversations will be saved here."
                  actionTitle="Start a chat"
                  onAction={() => navigation.navigate('Chat', {})}
                />
              )
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 18, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 14 },
  title: { fontSize: 28, fontWeight: '800' },
  clear: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  clearText: { fontWeight: '700', marginLeft: 5, fontSize: 13 },
  search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, marginBottom: 14, height: 46 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, outlineStyle: 'none' },
});
