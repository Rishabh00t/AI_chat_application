import React, { useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import TextField from '../components/TextField';
import GradientButton from '../components/GradientButton';
import Banner from '../components/Banner';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { colors } = useTheme();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const local = {};
    if (form.name.trim().length < 2) local.name = 'Please enter your name (2+ characters).';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) local.email = 'Please enter a valid email address.';
    if (form.password.length < 6) local.password = 'Password must be at least 6 characters.';
    if (form.confirm !== form.password) local.confirm = "Passwords don't match.";
    setErrors(local);
    setError('');
    if (Object.keys(local).length) return;

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
    } catch (e) {
      setErrors(e.errors || {});
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="A safe space to talk about anything, anytime."
      onBack={navigation.canGoBack() ? navigation.goBack : null}
      footer={
        <Pressable onPress={() => navigation.replace('Login')}>
          <Text style={{ color: colors.textMuted, fontSize: 15 }}>
            Already have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Log in</Text>
          </Text>
        </Pressable>
      }
    >
      <Banner message={error} onClose={() => setError('')} />
      <TextField label="Name" icon="person-outline" value={form.name} onChangeText={set('name')} placeholder="What should Aura call you?"
        autoComplete="name" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} error={errors.name} />
      <TextField ref={emailRef} label="Email" icon="mail-outline" value={form.email} onChangeText={set('email')} placeholder="you@example.com"
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()} error={errors.email} />
      <TextField ref={passwordRef} label="Password" icon="lock-closed-outline" value={form.password} onChangeText={set('password')}
        placeholder="At least 6 characters" secure autoComplete="new-password" returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()} error={errors.password} />
      <TextField ref={confirmRef} label="Confirm password" icon="shield-checkmark-outline" value={form.confirm} onChangeText={set('confirm')}
        placeholder="Type it again" secure autoComplete="new-password" returnKeyType="go" onSubmitEditing={submit} error={errors.confirm} />
      <GradientButton title="Create account" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
    </AuthLayout>
  );
}
