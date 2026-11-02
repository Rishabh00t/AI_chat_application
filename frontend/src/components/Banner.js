import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/** Inline message strip. type: 'error' | 'info' */
export default function Banner({ message, type = 'error', onClose, onRetry }) {
  const { colors } = useTheme();
  if (!message) return null;
  const tint = type === 'error' ? colors.danger : colors.warning;
  return (
    <View style={[styles.wrap, { backgroundColor: tint + '1A', borderColor: tint + '55' }]}>
      <Ionicons name={type === 'error' ? 'alert-circle' : 'information-circle'} size={18} color={tint} />
      <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8}><Text style={[styles.action, { color: tint }]}>Retry</Text></Pressable>
      ) : null}
      {onClose ? (
        <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Dismiss">
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  text: { flex: 1, fontSize: 13.5, marginHorizontal: 8, lineHeight: 19 },
  action: { fontWeight: '700', marginRight: 8 },
});
