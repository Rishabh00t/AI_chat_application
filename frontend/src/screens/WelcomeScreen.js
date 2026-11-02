import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientButton from '../components/GradientButton';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../context/ThemeContext';

const FEATURES = [
  { icon: 'heart-outline', title: 'Understands how you feel', text: 'Aura senses your emotions and responds with empathy.' },
  { icon: 'chatbubbles-outline', title: 'Remembers the conversation', text: 'Context-aware replies that actually listen.' },
  { icon: 'analytics-outline', title: 'Track your mood', text: 'Daily check-ins and trends to know yourself better.' },
];

export default function WelcomeScreen({ navigation }) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const orbStyle = {
    transform: [
      { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
      { translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
    ],
  };

  return (
    <LinearGradient colors={colors.mode === 'dark' ? ['#1B1540', '#0F0E17'] : ['#EDE7FF', '#F5F4FB']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Animated.View style={orbStyle}>
              <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.orb}>
                <Text style={styles.orbEmoji}>✨</Text>
              </LinearGradient>
            </Animated.View>
            <FadeInView delay={100}>
              <Text style={[styles.title, { color: colors.text }]}>Aura</Text>
            </FadeInView>
            <FadeInView delay={200}>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Your emotionally intelligent AI companion.{'\n'}Here to listen, understand and support you.
              </Text>
            </FadeInView>
          </View>

          <View style={styles.features}>
            {FEATURES.map((f, i) => (
              <FadeInView key={f.title} delay={300 + i * 110}>
                <View style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.primary + '1F' }]}>
                    <Ionicons name={f.icon} size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                    <Text style={[styles.featureText, { color: colors.textMuted }]}>{f.text}</Text>
                  </View>
                </View>
              </FadeInView>
            ))}
          </View>

          <FadeInView delay={700} style={styles.actions}>
            <GradientButton title="Get started" icon="sparkles-outline" onPress={() => navigation.navigate('Register')} />
            <GradientButton title="I already have an account" variant="secondary" onPress={() => navigation.navigate('Login')} style={{ marginTop: 12 }} />
          </FadeInView>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, padding: 24, justifyContent: 'space-between', maxWidth: 560, width: '100%', alignSelf: 'center' },
  hero: { alignItems: 'center', marginTop: 32 },
  orb: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', shadowColor: '#7C5CFF', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  orbEmoji: { fontSize: 50 },
  title: { fontSize: 42, fontWeight: '800', marginTop: 22, letterSpacing: 0.5, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginTop: 8, lineHeight: 24 },
  features: { marginVertical: 28 },
  feature: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth },
  featureIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  featureTitle: { fontSize: 15, fontWeight: '700' },
  featureText: { fontSize: 13.5, marginTop: 2, lineHeight: 19 },
  actions: { marginBottom: 8 },
});
