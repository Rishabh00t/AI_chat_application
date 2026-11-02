import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const LABELS = ['A little', 'Somewhat', 'Moderately', 'Very', 'Extremely'];

/** 1–5 intensity selector. */
export default function IntensityPicker({ value, onChange, color }) {
  const { colors } = useTheme();
  const tint = color || colors.primary;
  return (
    <View>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityLabel={`Intensity ${n}: ${LABELS[n - 1]}`}
            style={[styles.step, { backgroundColor: n <= value ? tint : colors.surfaceAlt, height: 10 + n * 4 }]}
          />
        ))}
      </View>
      <Text style={[styles.caption, { color: colors.textMuted }]}>{LABELS[value - 1]} ({value}/5)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  step: { flex: 1, marginHorizontal: 4, borderRadius: 8 },
  caption: { fontSize: 13, marginTop: 8, textAlign: 'center', fontWeight: '600' },
});
