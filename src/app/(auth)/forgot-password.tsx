/**
 * TOGETHERLY — FORGOT PASSWORD SCREEN
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
import { useThemeStore } from '@/stores/useThemeStore';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { AuthService } from '@/services/firebase/authService';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async () => {
    if (!email.includes('@')) return;
    setLoading(true);
    try {
      await AuthService.resetPassword(email);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.xl,
              },
              theme.shadows.medium,
            ]}
          >
            {submitted ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={48} color={theme.colors.success} />
                <Text style={[styles.successTitle, { color: theme.colors.textPrimary }]}>
                  Reset Link Sent
                </Text>
                <Text style={[styles.successDesc, { color: theme.colors.textSecondary }]}>
                  We have sent instructions to {email}. Follow the link to choose a new password.
                </Text>
                <AppButton
                  title="Back to Sign In"
                  onPress={() => router.replace('/(auth)/login')}
                  style={{ marginTop: 24, width: '100%' }}
                />
              </View>
            ) : (
              <>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  Reset Password
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Enter the email associated with your account and we&apos;ll send you a link to reset your password.
                </Text>

                <AppTextInput
                  label="Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <AppButton
                  title="Send Reset Link"
                  onPress={handleReset}
                  loading={loading}
                  disabled={!email}
                  size="lg"
                  style={{ marginTop: 8 }}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { padding: 24, justifyContent: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', marginBottom: 12 },
  card: { padding: 24, borderWidth: 1 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  successBox: { alignItems: 'center', paddingVertical: 16 },
  successTitle: { fontSize: 20, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  successDesc: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
});

