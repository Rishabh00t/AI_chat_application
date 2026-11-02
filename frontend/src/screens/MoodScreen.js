import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { moodApi } from '../api';
import { EMOTIONS, getEmotion, MOOD_GREETINGS } from '../constants/emotions';
import { localDateString, parseLocalDate } from '../utils/time';
import { confirm } from '../utils/confirm';
import Card from '../components/Card';
import MoodPicker from '../components/MoodPicker';
import IntensityPicker from '../components/IntensityPicker';
import TextField from '../components/TextField';
import GradientButton from '../components/GradientButton';
import Banner from '../components/Banner';
import FadeInView from '../components/FadeInView';

const CHART_DAYS = 14;
const BAR_MAX = 96;

export default function MoodScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [mood, setMood] = useState(null);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await moodApi.list(30);
      setData(res);
      if (res.today) {
        setMood(res.today.mood);
        setIntensity(res.today.intensity);
        setNote(res.today.note || '');
      }
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    if (!mood) { setError('Pick a mood first.'); return; }
    setSaving(true);
    setSaved(false);
    try {
      await moodApi.save(mood, intensity, note);
      setSaved(true);
      await load();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entry) => {
    const ok = await confirm({ title: 'Delete check-in?', message: `Remove your mood for ${entry.entry_date}?`, confirmText: 'Delete', destructive: true });
    if (!ok) return;
    try {
      await moodApi.remove(entry.id);
      if (entry.entry_date === localDateString()) { setMood(null); setIntensity(3); setNote(''); }
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!data && !error) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  // Build the last 14 days (oldest -> newest) for the chart.
  const byDate = Object.fromEntries((data?.entries || []).map((e) => [e.entry_date, e]));
  const days = Array.from({ length: CHART_DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (CHART_DAYS - 1 - i));
    const key = localDateString(d);
    return { key, date: d, entry: byDate[key] };
  });
  const counts = data?.summary.counts || {};
  const maxCount = Math.max(1, ...Object.values(counts));
  const selected = mood ? getEmotion(mood) : null;

  return (
    <SafeAreaView edges={['top']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>Mood tracker</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>A quick daily check-in helps Aura understand you better.</Text>

        <Banner message={error} onClose={() => setError('')} onRetry={!data ? load : undefined} />

        <FadeInView>
          <Card title={data?.today ? "Update today's check-in" : 'How are you feeling today?'}>
            <MoodPicker value={mood} onChange={setMood} />
            {selected ? (
              <FadeInView key={mood}>
                <Text style={[styles.moodLine, { color: selected.color }]}>{MOOD_GREETINGS[mood]}</Text>
                <Text style={[styles.label, { color: colors.textMuted }]}>How strong is this feeling?</Text>
                <IntensityPicker value={intensity} onChange={setIntensity} color={selected.color} />
                <TextField
                  label="Note (optional)"
                  value={note}
                  onChangeText={setNote}
                  placeholder="What's behind this feeling?"
                  multiline
                  maxLength={500}
                  style={{ marginTop: 16 }}
                />
                <GradientButton
                  title={saved ? 'Saved!' : data?.today ? 'Update check-in' : 'Save check-in'}
                  icon={saved ? 'checkmark-circle' : 'heart'}
                  onPress={save}
                  loading={saving}
                />
              </FadeInView>
            ) : null}
          </Card>
        </FadeInView>

        {data ? (
          <>
            <View style={styles.stats}>
              <Stat icon="flame" color="#FF8A3D" value={data.summary.streak} label="Day streak" colors={colors} />
              <Stat icon="calendar" color={colors.primary} value={`${data.summary.logged}/30`} label="Days logged" colors={colors} />
              <Stat
                emoji={data.summary.top_mood ? getEmotion(data.summary.top_mood).emoji : '—'}
                value={data.summary.top_mood ? getEmotion(data.summary.top_mood).label : 'None'}
                label="Top mood"
                colors={colors}
              />
            </View>

            <Card title="Last 14 days">
              <View style={styles.chart}>
                {days.map(({ key, date, entry }) => {
                  const e = entry ? getEmotion(entry.mood) : null;
                  const h = e ? 18 + ((e.valence + 2) / 4) * (BAR_MAX - 18) : 6;
                  return (
                    <View key={key} style={styles.barCol}>
                      <Text style={styles.barEmoji}>{e ? e.emoji : ''}</Text>
                      <View style={[styles.bar, { height: h, backgroundColor: e ? e.color : colors.surfaceAlt }]} />
                      <Text style={[styles.barLabel, { color: key === localDateString() ? colors.primary : colors.textFaint }]}>
                        {date.toLocaleDateString([], { weekday: 'narrow' })}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Text style={[styles.chartHint, { color: colors.textFaint }]}>Taller bars = more positive moods</Text>
            </Card>

            {Object.keys(counts).length ? (
              <Card title="Mood breakdown (30 days)">
                {Object.entries(counts).map(([key, n]) => {
                  const e = EMOTIONS[key] || EMOTIONS.neutral;
                  return (
                    <View key={key} style={styles.breakRow}>
                      <Text style={styles.breakEmoji}>{e.emoji}</Text>
                      <Text style={[styles.breakLabel, { color: colors.text }]}>{e.label}</Text>
                      <View style={[styles.breakTrack, { backgroundColor: colors.surfaceAlt }]}>
                        <View style={[styles.breakFill, { width: `${(n / maxCount) * 100}%`, backgroundColor: e.color }]} />
                      </View>
                      <Text style={[styles.breakCount, { color: colors.textMuted }]}>{n}</Text>
                    </View>
                  );
                })}
              </Card>
            ) : null}

            {data.entries.length ? (
              <Card title="Recent check-ins">
                {data.entries.slice(0, 10).map((entry) => {
                  const e = getEmotion(entry.mood);
                  return (
                    <View key={entry.id} style={[styles.entry, { borderBottomColor: colors.border }]}>
                      <Text style={{ fontSize: 26 }}>{e.emoji}</Text>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.entryTitle, { color: colors.text }]}>
                          {e.label} <Text style={{ color: colors.textFaint, fontWeight: '500' }}>· {entry.intensity}/5</Text>
                        </Text>
                        <Text style={[styles.entryDate, { color: colors.textMuted }]}>
                          {parseLocalDate(entry.entry_date).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}
                        </Text>
                        {entry.note ? <Text style={[styles.entryNote, { color: colors.textMuted }]}>“{entry.note}”</Text> : null}
                      </View>
                      <Pressable onPress={() => remove(entry)} hitSlop={10} accessibilityLabel="Delete check-in">
                        <Ionicons name="close-circle-outline" size={20} color={colors.textFaint} />
                      </Pressable>
                    </View>
                  );
                })}
              </Card>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, emoji, color, value, label, colors }) {
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {emoji ? <Text style={{ fontSize: 22 }}>{emoji}</Text> : <Ionicons name={icon} size={22} color={color} />}
      <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  subtitle: { fontSize: 14.5, marginTop: 4, marginBottom: 16 },
  moodLine: { fontSize: 14.5, fontWeight: '600', textAlign: 'center', marginVertical: 10, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  stat: { width: '31.5%', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  statValue: { fontSize: 17, fontWeight: '800', marginTop: 6 },
  statLabel: { fontSize: 12, marginTop: 2 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: BAR_MAX + 44 },
  barCol: { alignItems: 'center', flex: 1 },
  barEmoji: { fontSize: 11, height: 16 },
  bar: { width: '62%', borderRadius: 6, minWidth: 8 },
  barLabel: { fontSize: 11, marginTop: 6, fontWeight: '600' },
  chartHint: { fontSize: 12, textAlign: 'center', marginTop: 10 },
  breakRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  breakEmoji: { fontSize: 18, width: 28 },
  breakLabel: { width: 78, fontSize: 13.5, fontWeight: '600' },
  breakTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden', marginHorizontal: 8 },
  breakFill: { height: '100%', borderRadius: 5 },
  breakCount: { width: 22, textAlign: 'right', fontWeight: '700' },
  entry: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  entryTitle: { fontSize: 15, fontWeight: '700' },
  entryDate: { fontSize: 12.5, marginTop: 2 },
  entryNote: { fontSize: 13, marginTop: 4, fontStyle: 'italic' },
});
