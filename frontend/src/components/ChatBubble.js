import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatTime } from '../utils/time';
import AuraAvatar from './AuraAvatar';
import EmotionChip from './EmotionChip';
import FadeInView from './FadeInView';

/**
 * One chat message.
 * message: { role: 'user'|'assistant', content, created_at, emotion?, status?: 'sending'|'failed' }
 */
function ChatBubble({ message, onRetry, animate = true }) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';
  const failed = message.status === 'failed';

  const meta = (
    <View style={[styles.metaRow, isUser && { justifyContent: 'flex-end' }]}>
      {isUser && message.emotion ? <EmotionChip emotion={message.emotion} style={{ marginRight: 6 }} /> : null}
      {message.status === 'sending' ? (
        <Text style={[styles.time, { color: colors.textFaint }]}>Sending…</Text>
      ) : failed ? (
        <Pressable onPress={() => onRetry?.(message)} hitSlop={8} style={styles.retry}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text style={[styles.time, { color: colors.danger, marginLeft: 4 }]}>Not sent · Tap to retry</Text>
        </Pressable>
      ) : (
        <Text style={[styles.time, { color: colors.textFaint }]}>
          {formatTime(message.created_at)}
          {!isUser && message.source === 'offline' ? ' · offline' : ''}
        </Text>
      )}
    </View>
  );

  const body = isUser ? (
    <View style={styles.userWrap}>
      <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bubble, styles.userBubble, failed && { opacity: 0.6 }]}>
        <Text style={[styles.text, { color: colors.bubbleUserText }]} selectable>{message.content}</Text>
      </LinearGradient>
      {meta}
    </View>
  ) : (
    <View style={styles.aiRow}>
      <AuraAvatar size={30} />
      <View style={styles.aiWrap}>
        <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.bubbleAi, borderColor: colors.border }]}>
          <Text style={[styles.text, { color: colors.bubbleAiText }]} selectable>{message.content}</Text>
        </View>
        {meta}
      </View>
    </View>
  );

  return animate ? <FadeInView distance={10} duration={280}>{body}</FadeInView> : body;
}

export default memo(ChatBubble);

const styles = StyleSheet.create({
  userWrap: { alignItems: 'flex-end', paddingHorizontal: 14, marginVertical: 5, marginLeft: 50 },
  aiRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, marginVertical: 5, marginRight: 40 },
  aiWrap: { marginLeft: 8, flexShrink: 1 },
  bubble: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 20, maxWidth: '100%' },
  userBubble: { borderBottomRightRadius: 6 },
  aiBubble: { borderBottomLeftRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  text: { fontSize: 15.5, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginHorizontal: 4 },
  time: { fontSize: 11 },
  retry: { flexDirection: 'row', alignItems: 'center' },
});
