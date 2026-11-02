import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, shadow } from '../theme/palette';

/**
 * Primary button. variant: 'primary' (gradient) | 'secondary' (outline) | 'ghost' | 'danger'
 */
export default function GradientButton({
  title, onPress, loading = false, disabled = false, variant = 'primary', icon, style, small = false,
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const animate = (to) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  const textColor = variant === 'primary' || variant === 'danger' ? '#fff' : variant === 'secondary' ? colors.primary : colors.textMuted;
  const content = (
    <View style={[styles.inner, small && styles.innerSmall]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 16 : 19} color={textColor} style={{ marginRight: 8 }} /> : null}
          <Text style={[styles.text, small && styles.textSmall, { color: textColor }]}>{title}</Text>
        </>
      )}
    </View>
  );

  return (
    <Animated.View style={[{ transform: [{ scale }], opacity: isDisabled ? 0.6 : 1 }, style]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => animate(0.96)}
        onPressOut={() => animate(1)}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {variant === 'primary' ? (
          <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.base, shadow(colors, 4)]}>
            {content}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.base,
              variant === 'secondary' && { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' },
              variant === 'danger' && { backgroundColor: colors.danger },
              variant === 'ghost' && { backgroundColor: colors.surfaceAlt },
            ]}
          >
            {content}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, overflow: 'hidden' },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 24, minHeight: 52 },
  innerSmall: { paddingVertical: 9, paddingHorizontal: 16, minHeight: 38 },
  text: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  textSmall: { fontSize: 14 },
});
