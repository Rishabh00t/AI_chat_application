import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { chatApi, profileApi } from '../api';
import { confirm, notify } from '../utils/confirm';
import { parseServerDate } from '../utils/time';
import Card from '../components/Card';
import TextField from '../components/TextField';
import GradientButton from '../components/GradientButton';
import Banner from '../components/Banner';

const AVATARS = ['🙂', '😎', '🦊', '🐼', '🐱', '🌸', '🌻', '🌙', '⭐', '🎧', '🧠', '🦋'];
const THEMES = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function ProfileScreen() {
  const { user, stats, logout, refresh, setUser } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => { refresh().catch(() => {}); }, [refresh]));

  const update = async (fields) => {
    try {
      const res = await profileApi.update(fields);
      setUser(res.user);
      setError('');
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  const chooseTheme = (key) => {
    setPreference(key); // instant
    update({ theme: key }); // persisted to the account
  };

  const saveName = async () => {
    setSavingName(true);
    if (await update({ name: name.trim() })) notify('Saved', 'Your name has been updated.');
    setSavingName(false);
  };

  const changePassword = async () => {
    const errs = {};
    if (!pw.current) errs.current = 'Enter your current password.';
    if (pw.next.length < 6) errs.next = 'New password must be at least 6 characters.';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setSavingPw(true);
    try {
      await profileApi.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '' });
      setShowPassword(false);
      notify('Password updated', 'Your password has been changed.');
    } catch (e) {
      setPwErrors({ current: e.errors?.current_password, next: e.errors?.new_password });
      if (!e.errors) setError(e.message);
    } finally {
      setSavingPw(false);
    }
  };

  const clearHistory = async () => {
    const ok = await confirm({ title: 'Delete all chat history?', message: 'Every conversation with Aura will be permanently deleted.', confirmText: 'Delete all', destructive: true });
    if (!ok) return;
    try {
      const res = await chatApi.removeAll();
      refresh().catch(() => {});
      notify('History cleared', `${res.deleted} conversation(s) deleted.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const doLogout = async () => {
    if (await confirm({ title: 'Log out?', message: 'You can log back in anytime.', confirmText: 'Log out' })) logout();
  };

  const memberSince = user?.created_at ? parseServerDate(user.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' }) : '';

  return (
    <SafeAreaView edges={['top']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt, borderColor: colors.primary }]}>
            <Text style={{ fontSize: 46 }}>{user?.avatar}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
          {memberSince ? <Text style={[styles.since, { color: colors.textFaint }]}>Member since {memberSince}</Text> : null}
        </View>

        <Banner message={error} onClose={() => setError('')} />

        {stats ? (
          <View style={styles.stats}>
            {[
              ['Chats', stats.conversations, 'chatbubbles'],
              ['Messages', stats.messages, 'paper-plane'],
              ['Check-ins', stats.mood_entries, 'heart'],
            ].map(([label, value, icon]) => (
              <View key={label} style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name={icon} size={18} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Card title="Avatar">
          <View style={styles.avatarGrid}>
            {AVATARS.map((a) => (
              <Pressable
                key={a}
                onPress={() => update({ avatar: a })}
                style={[styles.avatarOption, { backgroundColor: colors.surfaceAlt, borderColor: user?.avatar === a ? colors.primary : 'transparent' }]}
                accessibilityLabel={`Choose avatar ${a}`}
              >
                <Text style={{ fontSize: 24 }}>{a}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card title="Appearance">
          <View style={[styles.segment, { backgroundColor: colors.surfaceAlt }]}>
            {THEMES.map((t) => {
              const active = preference === t.key;
              return (
                <Pressable key={t.key} onPress={() => chooseTheme(t.key)} style={[styles.segmentItem, active && { backgroundColor: colors.surface }]}
                  accessibilityRole="button" accessibilityState={{ selected: active }}>
                  <Ionicons name={t.icon} size={16} color={active ? colors.primary : colors.textMuted} />
                  <Text style={[styles.segmentText, { color: active ? colors.primary : colors.textMuted }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card title="Your details">
          <TextField label="Display name" icon="person-outline" value={name} onChangeText={setName} />
          <GradientButton title="Save name" small onPress={saveName} loading={savingName} disabled={name.trim().length < 2 || name.trim() === user?.name} />

          <Pressable onPress={() => setShowPassword((s) => !s)} style={styles.rowLink}>
            <Ionicons name="key-outline" size={18} color={colors.primary} />
            <Text style={[styles.rowLinkText, { color: colors.primary }]}>Change password</Text>
            <Ionicons name={showPassword ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
          </Pressable>
          {showPassword ? (
            <View style={{ marginTop: 10 }}>
              <TextField label="Current password" secure value={pw.current} onChangeText={(v) => setPw((p) => ({ ...p, current: v }))} error={pwErrors.current} />
              <TextField label="New password" secure value={pw.next} onChangeText={(v) => setPw((p) => ({ ...p, next: v }))} error={pwErrors.next} />
              <GradientButton title="Update password" small onPress={changePassword} loading={savingPw} />
            </View>
          ) : null}
        </Card>

        <Card title="Privacy">
          <GradientButton title="Delete all chat history" variant="ghost" icon="trash-outline" onPress={clearHistory} />
          <Text style={[styles.privacy, { color: colors.textFaint }]}>
            Your conversations are stored securely on your Aura server. Aura is a supportive companion, not a replacement for professional care.
          </Text>
        </Card>

        <GradientButton title="Log out" variant="danger" icon="log-out-outline" onPress={doLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 18, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' },
  hero: { alignItems: 'center', marginVertical: 16 },
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  name: { fontSize: 24, fontWeight: '800', marginTop: 12 },
  email: { fontSize: 14.5, marginTop: 2 },
  since: { fontSize: 12.5, marginTop: 4 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  stat: { width: '31.5%', alignItems: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 12 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  avatarOption: { width: '15%', aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 2 },
  segment: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  segmentItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 11 },
  segmentText: { fontWeight: '700', marginLeft: 6, fontSize: 14 },
  rowLink: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  rowLinkText: { flex: 1, fontWeight: '700', marginLeft: 8, fontSize: 14.5 },
  privacy: { fontSize: 12.5, marginTop: 12, lineHeight: 18 },
});
