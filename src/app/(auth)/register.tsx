/**
 * TOGETHERLY — REGISTRATION SCREEN
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { RegisterSchema } from '@/types';
import { Sparkles, ArrowLeft } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { setCouple } = useCoupleStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleRegister = async () => {
    clearError();
    setValidationError(null);

    const result = RegisterSchema.safeParse({ displayName, email, password });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message || 'Please check your inputs');
      return;
    }

    try {
      await register(email, password, displayName);
      // New user is unpaired, take them to avatar and pairing setup
      setCouple(null);
      router.replace('/(onboarding)/profile-setup');
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.brandContainer}>
            <View
              style={[
                styles.iconBubble,
                { backgroundColor: theme.colors.accent },
              ]}
            >
              <Sparkles size={28} color={theme.colors.secondary} />
            </View>
            <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
              Begin Your World
            </Text>
            <Text style={[styles.brandTagline, { color: theme.colors.textSecondary }]}>
              Create your account to start playing with your partner
            </Text>
          </View>

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
              label="Your First Name or Nickname"
              placeholder="e.g. Jordan"
              value={displayName}
              onChangeText={setDisplayName}
            />

            <AppTextInput
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppTextInput
              label="Password (min 8 characters)"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              isPassword
            />

            <AppButton
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              size="lg"
              style={styles.submitBtn}
            />

            <View style={styles.loginPrompt}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                Already registered?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 14 }}>
                  Sign In
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBubble: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  formCard: {
    padding: 24,
    borderWidth: 1,
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
  submitBtn: {
    marginTop: 8,
    marginBottom: 16,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

