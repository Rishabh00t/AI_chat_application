import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EMOTIONS, EMOTION_KEYS } from '../constants/emotions';
import { useTheme } from '../context/ThemeContext';

/** Grid of emotion tiles. `compact` shows a single row of the 6 most common moods. */
export default function MoodPicker({ value, onChange, compact = false }) {
  const { colors } = useTheme();
  const keys = compact ? ['happy', 'calm', 'neutral', 'tired', 'stressed', 'sad'] : EMOTION_KEYS;

  return (
    <View style={styles.grid}>
      {keys.map((key) => {
        const e = EMOTIONS[key];
        const selected = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={e.label}
            style={({ pressed }) => [
              styles.tile,
              compact ? styles.tileCompact : null,
              {
                backgroundColor: selected ? e.color + '26' : colors.surfaceAlt,
                borderColor: selected ? e.color : 'transparent',
                transform: [{ scale: pressed ? 0.94 : selected ? 1.04 : 1 }],
              },
            ]}
          >
            <Text style={[styles.emoji, compact && { fontSize: 24 }]}>{e.emoji}</Text>
            <Text style={[styles.label, { color: selected ? e.color : colors.textMuted }]} numberOfLines={1}>{e.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '23%', aspectRatio: 0.95, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  tileCompact: { width: '15.5%', aspectRatio: 0.8, borderRadius: 14 },
  emoji: { fontSize: 28 },
  label: { fontSize: 11, fontWeight: '700', marginTop: 4 },
});
