import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AuraAvatar from './AuraAvatar';

/** Shared shell for the Login and Register screens. */
export default function AuthLayout({ title, subtitle, onBack, children, footer }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {onBack ? (
            <Pressable onPress={onBack} style={[styles.back, { backgroundColor: colors.surfaceAlt }]} accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
          ) : null}
          <View style={styles.header}>
            <AuraAvatar size={64} />
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          </View>
          {children}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, padding: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
  back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  header: { alignItems: 'center', marginVertical: 24 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 16 },
  subtitle: { fontSize: 15, marginTop: 6, textAlign: 'center', lineHeight: 22 },
  footer: { marginTop: 24, alignItems: 'center' },
});
