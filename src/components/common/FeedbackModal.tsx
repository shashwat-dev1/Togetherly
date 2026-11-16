/**
 * TOGETHERLY — IN-APP PILOT FEEDBACK MODAL
 *
 * Allows pilot testers to easily report bugs, synchronization glitches,
 * game issues, or submit suggestions directly from the app.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Modal } from '@/components/common/Modal';
import { AppButton } from '@/components/common/AppButton';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { FeedbackService, PilotFeedbackCategory } from '@/services/feedback/feedbackService';
import { GAME_CATALOGUE } from '@/games/registry';
import { CheckCircle2, MessageSquarePlus } from 'lucide-react-native';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  defaultGameId?: string;
}

const CATEGORIES: { id: PilotFeedbackCategory; label: string; icon: string }[] = [
  { id: 'bug', label: 'Bug', icon: '🐞' },
  { id: 'sync_problem', label: 'Sync Issue', icon: '🔄' },
  { id: 'game_issue', label: 'Game Issue', icon: '🎮' },
  { id: 'ux_suggestion', label: 'Suggestion', icon: '💡' },
  { id: 'new_game_idea', label: 'Game Idea', icon: '✨' },
  { id: 'general', label: 'General', icon: '💬' },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  defaultGameId,
}) => {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { couple } = useCoupleStore();

  const [category, setCategory] = useState<PilotFeedbackCategory>('bug');
  const [description, setDescription] = useState('');
  const [selectedGameId, setSelectedGameId] = useState<string | undefined>(defaultGameId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Details Required', 'Please provide a short description of the issue or feedback.');
      return;
    }

    setIsSubmitting(true);
    try {
      await FeedbackService.submitFeedback({
        userId: user?.uid || 'anonymous_tester',
        userDisplayName: user?.displayName || 'Pilot Tester',
        coupleId: couple?.id,
        category,
        description: description.trim(),
        gameId: selectedGameId,
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDescription('');
        onClose();
      }, 1600);
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Pilot Tester Feedback">
      {submitted ? (
        <View style={styles.successContainer}>
          <CheckCircle2 size={48} color={theme.colors.success} />
          <Text style={[styles.successTitle, { color: theme.colors.textPrimary }]}>
            Thank You!
          </Text>
          <Text style={[styles.successSubtitle, { color: theme.colors.textSecondary }]}>
            Your feedback has been received. Your input helps make Togetherly better for everyone!
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            What type of feedback are you reporting?
          </Text>

          {/* Category Chips */}
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primaryLight
                        : theme.isDark
                        ? '#2A243C'
                        : '#F3EFF9',
                      borderColor: isSelected ? theme.colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      {
                        color: isSelected ? theme.colors.primaryDark : theme.colors.textPrimary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Related Game (Optional) */}
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 14 }]}>
            Related Game (Optional)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gameScroll}>
            <TouchableOpacity
              style={[
                styles.gameChip,
                {
                  backgroundColor: !selectedGameId
                    ? theme.colors.primary
                    : theme.isDark
                    ? '#2A243C'
                    : '#F3EFF9',
                },
              ]}
              onPress={() => setSelectedGameId(undefined)}
            >
              <Text style={{ color: !selectedGameId ? '#FFFFFF' : theme.colors.textSecondary, fontSize: 11 }}>
                None / General
              </Text>
            </TouchableOpacity>

            {GAME_CATALOGUE.map((g) => {
              const isSelected = selectedGameId === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.gameChip,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.isDark
                        ? '#2A243C'
                        : '#F3EFF9',
                    },
                  ]}
                  onPress={() => setSelectedGameId(g.id)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
                      fontSize: 11,
                      fontWeight: isSelected ? '700' : '500',
                    }}
                  >
                    {g.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Description Input */}
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 14 }]}>
            Description / What happened?
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.isDark ? '#27223B' : '#F6F2FC',
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="Tell us what you experienced, what was expected, or what could be improved..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />

          <AppButton
            title={isSubmitting ? 'Submitting...' : 'Send Feedback'}
            onPress={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            icon={isSubmitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <MessageSquarePlus size={16} color="#FFFFFF" />}
            style={{ marginTop: 18 }}
          />
        </ScrollView>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryIcon: { fontSize: 14 },
  categoryLabel: { fontSize: 12 },
  gameScroll: { gap: 8, paddingVertical: 2 },
  gameChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minHeight: 90,
    fontSize: 13,
    lineHeight: 18,
  },
  successContainer: { alignItems: 'center', paddingVertical: 20 },
  successTitle: { fontSize: 18, fontWeight: '800', marginTop: 12 },
  successSubtitle: { fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
