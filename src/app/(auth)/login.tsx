/**
 * TOGETHERLY — LOGIN SCREEN
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { LoginSchema } from '@/types';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleLogin = async () => {
    clearError();
    setValidationError(null);

    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message || 'Invalid credentials');
      return;
    }

    try {
      await login(email, password);
      router.replace('/(tabs)/home');
    } catch {
      // Handled in store
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View
              style={[
                styles.iconBubble,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Image source={require('../../../assets/images/togetherly-brand.png')} style={{ width: 64, height: 64, borderRadius: 15 }} accessibilityLabel="Togetherly" />
            </View>
            <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
              Togetherly
            </Text>
            <Text style={[styles.brandTagline, { color: theme.colors.textSecondary }]}>
              Two people. One little world.
            </Text>
          </View>

          {/* Form */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.xl,
              },
              theme.shadows.medium,
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Welcome Back
            </Text>

            {(error || validationError) && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: theme.colors.errorSoft },
                ]}
              >
                <Text style={[styles.errorBannerText, { color: theme.colors.error }]}>
                  {validationError || error}
                </Text>
              </View>
            )}

            <AppTextInput
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppTextInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              isPassword
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPassBtn}
            >
              <Text style={[styles.forgotPassText, { color: theme.colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <AppButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
              style={styles.submitBtn}
            />

            <View style={styles.registerPrompt}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                Don&apos;t have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 14 }}>
                  Create One
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 12,
  },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: '500',
  },
  formCard: {
    padding: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotPassText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginBottom: 16,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

