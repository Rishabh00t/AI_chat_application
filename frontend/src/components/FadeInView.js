import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/** Fades and slides children in on mount. */
export default function FadeInView({ children, delay = 0, distance = 14, duration = 380, style }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration, delay, useNativeDriver: true }).start();
  }, [progress, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
