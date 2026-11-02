import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getEmotion } from '../constants/emotions';
import { formatRelative } from '../utils/time';
import { radius } from '../theme/palette';

export default function ConversationCard({ conversation, onPress, onDelete }) {
  const { colors } = useTheme();
  const emotion = conversation.last_emotion ? getEmotion(conversation.last_emotion) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open conversation ${conversation.title}`}
    >
      <View style={[styles.icon, { backgroundColor: (emotion?.color || colors.primary) + '22' }]}>
        <Text style={{ fontSize: 22 }}>{emotion ? emotion.emoji : '💬'}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{conversation.title}</Text>
          <Text style={[styles.time, { color: colors.textFaint }]}>{formatRelative(conversation.updated_at)}</Text>
        </View>
        <Text style={[styles.preview, { color: colors.textMuted }]} numberOfLines={2}>
          {conversation.last_message || 'No messages yet'}
        </Text>
      </View>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={10} style={styles.delete} accessibilityLabel="Delete conversation">
          <Ionicons name="trash-outline" size={19} color={colors.textFaint} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15.5, fontWeight: '700', flex: 1, marginRight: 8 },
  time: { fontSize: 12 },
  preview: { fontSize: 13.5, marginTop: 3, lineHeight: 19 },
  delete: { paddingLeft: 12, paddingVertical: 6 },
});
