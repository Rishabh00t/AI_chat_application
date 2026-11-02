import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { chatApi, moodApi } from '../api';
import { getEmotion, MOOD_GREETINGS, MOOD_TIPS } from '../constants/emotions';
import { timeOfDayGreeting } from '../utils/time';
import Card from '../components/Card';
import MoodPicker from '../components/MoodPicker';
import ConversationCard from '../components/ConversationCard';
import GradientButton from '../components/GradientButton';
import Banner from '../components/Banner';
import FadeInView from '../components/FadeInView';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [today, setToday] = useState(null);
  const [streak, setStreak] = useState(0);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [moods, convs] = await Promise.all([moodApi.list(7), chatApi.conversations()]);
      setToday(moods.today);
      setStreak(moods.summary.streak);
      setRecent(convs.conversations.slice(0, 3));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const quickLog = async (mood) => {
    setSaving(mood);
    try {
      const res = await moodApi.save(mood, today?.mood === mood ? today.intensity : 3, today?.note || '');
      setToday(res.entry);
      setStreak(res.streak);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  const firstName = (user?.name || '').split(' ')[0];
  const mood = today ? getEmotion(today.mood) : null;
  const greetingLine = today ? MOOD_GREETINGS[today.mood] : 'How are you feeling today? Check in below or just start chatting.';
  const isLowMood = mood && mood.valence < 0;

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        <LinearGradient colors={colors.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hello}>{timeOfDayGreeting()},</Text>
                <Text style={styles.name}>{firstName} {mood ? mood.emoji : '👋'}</Text>
              </View>
              <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatar} accessibilityLabel="Open profile">
                <Text style={{ fontSize: 26 }}>{user?.avatar || '🙂'}</Text>
              </Pressable>
            </View>
            <FadeInView key={today?.mood || 'none'}>
              <Text style={styles.greeting}>{greetingLine}</Text>
            </FadeInView>
            {streak > 0 ? (
              <View style={styles.streak}>
                <Ionicons name="flame" size={15} color="#FFD27A" />
                <Text style={styles.streakText}>{streak}-day check-in streak</Text>
              </View>
            ) : null}
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          <Banner message={error} onRetry={load} onClose={() => setError('')} />

          <FadeInView delay={50}>
            <Card
              title={today ? "Today's mood" : 'How are you feeling?'}
              right={
                <Pressable onPress={() => navigation.navigate('Mood')} hitSlop={8}>
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>{today ? 'Details' : 'More moods'}</Text>
                </Pressable>
              }
            >
              {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
              ) : (
                <>
                  <MoodPicker compact value={today?.mood} onChange={quickLog} />
                  {saving ? <Text style={[styles.hint, { color: colors.textMuted }]}>Saving…</Text> : null}
                  {mood && !saving ? (
                    <Text style={[styles.hint, { color: colors.textMuted }]}>
                      Logged as <Text style={{ color: mood.color, fontWeight: '700' }}>{mood.label}</Text>. Tap another to update.
                    </Text>
                  ) : null}
                </>
              )}
            </Card>
          </FadeInView>

          <FadeInView delay={120}>
            <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <Text style={styles.ctaTitle}>{isLowMood ? 'Want to talk it through?' : 'Ready to chat?'}</Text>
              <Text style={styles.ctaText}>
                {isLowMood
                  ? `Aura noticed you're feeling ${mood.label.toLowerCase()}. Sharing can make it lighter.`
                  : 'Aura is here to listen — about anything, big or small.'}
              </Text>
              <Pressable
                style={styles.ctaButton}
                onPress={() =>
                  navigation.navigate('Chat', isLowMood ? { initialMessage: `I'm feeling ${mood.label.toLowerCase()} today.` } : {})
                }
                accessibilityRole="button"
              >
                <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                <Text style={[styles.ctaButtonText, { color: colors.primary }]}>Start a new chat</Text>
              </Pressable>
            </LinearGradient>
          </FadeInView>

          {mood ? (
            <FadeInView delay={180}>
              <Card title="💡 A little tip for you">
                <Text style={[styles.tip, { color: colors.textMuted }]}>{MOOD_TIPS[today.mood]}</Text>
              </Card>
            </FadeInView>
          ) : null}

          <FadeInView delay={240}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent conversations</Text>
              {recent.length ? (
                <Pressable onPress={() => navigation.navigate('History')} hitSlop={8}>
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>See all</Text>
                </Pressable>
              ) : null}
            </View>
            {!loading && recent.length === 0 ? (
              <Card>
                <Text style={[styles.tip, { color: colors.textMuted, textAlign: 'center' }]}>
                  No chats yet. Your conversations with Aura will appear here.
                </Text>
                <GradientButton title="Say hello to Aura" small variant="secondary" style={{ marginTop: 14 }}
                  onPress={() => navigation.navigate('Chat', {})} />
              </Card>
            ) : (
              recent.map((c) => (
                <ConversationCard key={c.id} conversation={c} onPress={() => navigation.navigate('Chat', { conversationId: c.id })} />
              ))
            )}
          </FadeInView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { paddingHorizontal: 22, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  hello: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600' },
  name: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 2 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  greeting: { color: 'rgba(255,255,255,0.95)', fontSize: 15.5, lineHeight: 22, marginTop: 14 },
  streak: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginTop: 12 },
  streakText: { color: '#fff', fontSize: 12.5, fontWeight: '700', marginLeft: 5 },
  body: { padding: 18, marginTop: -14, maxWidth: 720, width: '100%', alignSelf: 'center' },
  hint: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  cta: { borderRadius: 22, padding: 20, marginBottom: 16 },
  ctaTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  ctaText: { color: 'rgba(255,255,255,0.9)', fontSize: 14.5, marginTop: 6, lineHeight: 20 },
  ctaButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, marginTop: 14 },
  ctaButtonText: { fontWeight: '800', marginLeft: 8, fontSize: 14.5 },
  tip: { fontSize: 14.5, lineHeight: 21 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
});
