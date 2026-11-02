import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import GradientButton from './GradientButton';

export default function EmptyState({ emoji = '🌱', title, message, actionTitle, onAction }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text> : null}
      {actionTitle ? <GradientButton title={actionTitle} onPress={onAction} style={{ marginTop: 20 }} small icon="chatbubble-ellipses-outline" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 54, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 14.5, textAlign: 'center', marginTop: 6, lineHeight: 21 },
});
