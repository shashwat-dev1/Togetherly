/**
 * TOGETHERLY — PROFILE SETUP & AVATAR PICKER
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { Avatar, AVAILABLE_AVATARS } from '@/components/common/Avatar';
import { Sparkles } from 'lucide-react-native';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user, updateAvatar } = useAuthStore();

  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarId || 'avatar_bear');
  const [name, setName] = useState(user?.displayName || '');

  const handleContinue = async () => {
    await updateAvatar(selectedAvatar);
    router.replace('/(onboarding)/pair');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconBubble,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Sparkles size={28} color={theme.colors.primaryDark} />
          </View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Pick Your Avatar
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Choose how your partner sees you in your little world.
          </Text>
        </View>

        {/* Selected Avatar Preview */}
        <View style={styles.avatarPreviewBox}>
          <Avatar id={selectedAvatar} size={88} />
          <Text style={[styles.previewName, { color: theme.colors.textPrimary }]}>
            {name || 'Your Name'}
          </Text>
        </View>

        {/* Avatar Grid */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.xl,
            },
            theme.shadows.soft,
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            SELECT CHARACTER
          </Text>

          <View style={styles.avatarGrid}>
            {AVAILABLE_AVATARS.map((avatarId) => {
              const isSelected = selectedAvatar === avatarId;
              return (
                <TouchableOpacity
                  key={avatarId}
                  activeOpacity={0.8}
                  onPress={() => setSelectedAvatar(avatarId)}
                  style={[
                    styles.avatarCell,
                    {
                      borderColor: isSelected
                        ? theme.colors.primary
                        : 'transparent',
                      backgroundColor: isSelected
                        ? theme.colors.primaryLight
                        : 'transparent',
                    },
                  ]}
                >
                  <Avatar id={avatarId} size={54} />
                </TouchableOpacity>
              );
            })}
          </View>

          <AppTextInput
            label="Your Nickname"
            placeholder="e.g. Alex"
            value={name}
            onChangeText={setName}
            style={{ marginTop: 12 }}
          />

          <AppButton
            title="Next: Pair with Partner"
            onPress={handleContinue}
            size="lg"
            style={{ marginTop: 12 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 20 },
  iconBubble: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  avatarPreviewBox: { alignItems: 'center', marginBottom: 24 },
  previewName: { fontSize: 18, fontWeight: '700', marginTop: 10 },
  card: { padding: 20, borderWidth: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 14 },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  avatarCell: {
    width: '23%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 10,
  },
});

