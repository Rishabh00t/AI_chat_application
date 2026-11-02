import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/** Multiline message box with gradient send button. Enter sends on web (Shift+Enter = newline). */
export default function ChatInput({ onSend, disabled }) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !disabled;

  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={[styles.bar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <View style={[styles.field, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Share what's on your mind…"
          placeholderTextColor={colors.textFaint}
          style={[styles.input, { color: colors.text }]}
          multiline
          maxLength={4000}
          accessibilityLabel="Message"
          onKeyPress={(e) => {
            if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
      </View>
      <Pressable onPress={send} disabled={!canSend} accessibilityRole="button" accessibilityLabel="Send message">
        <LinearGradient
          colors={canSend ? colors.gradient : [colors.surfaceAlt, colors.surfaceAlt]}
          style={styles.send}
        >
          <Ionicons name="arrow-up" size={22} color={canSend ? '#fff' : colors.textFaint} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, borderTopWidth: StyleSheet.hairlineWidth },
  field: { flex: 1, borderRadius: 24, borderWidth: 1, paddingHorizontal: 16, marginRight: 10, minHeight: 46, justifyContent: 'center' },
  input: { fontSize: 15.5, maxHeight: 120, paddingTop: Platform.OS === 'ios' ? 13 : 10, paddingBottom: Platform.OS === 'ios' ? 13 : 10, outlineStyle: 'none' },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
