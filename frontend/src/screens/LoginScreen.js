import React, { useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import TextField from '../components/TextField';
import GradientButton from '../components/GradientButton';
import Banner from '../components/Banner';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);

  const submit = async () => {
    const local = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) local.email = 'Please enter a valid email address.';
    if (!password) local.password = 'Password is required.';
    setErrors(local);
    setError('');
    if (Object.keys(local).length) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setErrors(e.errors || {});
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Aura missed you. Log in to continue your conversations."
      onBack={navigation.canGoBack() ? navigation.goBack : null}
      footer={
        <Pressable onPress={() => navigation.replace('Register')}>
          <Text style={{ color: colors.textMuted, fontSize: 15 }}>
            New here? <Text style={{ color: colors.primary, fontWeight: '700' }}>Create an account</Text>
          </Text>
        </Pressable>
      }
    >
      <Banner message={error} onClose={() => setError('')} />
      <TextField
        label="Email"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secure
        autoComplete="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={errors.password}
      />
      <GradientButton title="Log in" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
    </AuthLayout>
  );
}
