import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getEmotion } from '../constants/emotions';

/** Small pill showing an emotion, e.g. "😫 Stressed". */
export default function EmotionChip({ emotion, prefix, intensity, style }) {
  if (!emotion) return null;
  const e = getEmotion(emotion);
  return (
    <View style={[styles.chip, { backgroundColor: e.color + '22', borderColor: e.color + '55' }, style]}>
      <Text style={styles.emoji}>{e.emoji}</Text>
      <Text style={[styles.text, { color: e.color }]}>
        {prefix ? `${prefix} ` : ''}{e.label}{intensity ? ` · ${intensity}/5` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
  emoji: { fontSize: 12, marginRight: 4 },
  text: { fontSize: 11.5, fontWeight: '700' },
});
