import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AuraAvatar from './AuraAvatar';

/** Three bouncing dots shown while Aura is "thinking". */
export default function TypingIndicator() {
  const { colors } = useTheme();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(d, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 320, useNativeDriver: true }),
          Animated.delay((2 - i) * 160 + 200),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.row} accessibilityLabel="Aura is typing">
      <AuraAvatar size={30} />
      <View style={[styles.bubble, { backgroundColor: colors.bubbleAi, borderColor: colors.border }]}>
        {dots.map((d, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: colors.primary },
              {
                opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: colors.textFaint }]}>Aura is typing…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginVertical: 6 },
  bubble: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 14, marginLeft: 8, borderWidth: StyleSheet.hairlineWidth },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 2.5 },
  label: { fontSize: 12, marginLeft: 10, fontStyle: 'italic' },
});
