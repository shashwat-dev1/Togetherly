/**
 * TOGETHERLY — PILOT FEEDBACK SERVICE
 *
 * Collects structured in-app reports from closed pilot testers:
 * Bugs, Game issues, Synchronization problems, UI/UX suggestions, and New game ideas.
 * Persists to Firestore `pilotFeedback` collection (protected by Security Rules).
 */
import { runtimeMode, db } from '@/services/firebase/config';
import { LoggingService } from '@/services/telemetry/loggingService';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export type PilotFeedbackCategory =
  | 'bug'
  | 'game_issue'
  | 'sync_problem'
  | 'ux_suggestion'
  | 'new_game_idea'
  | 'general';

export interface PilotFeedbackSubmission {
  id?: string;
  userId: string;
  userDisplayName?: string;
  coupleId?: string;
  category: PilotFeedbackCategory;
  description: string;
  gameId?: string;
  appVersion: string;
  timestamp: number;
}

// In-Memory store for mock mode
const mockFeedbackInbox: PilotFeedbackSubmission[] = [];

export const FeedbackService = {
  /**
   * Submits tester feedback to Firestore.
   */
  async submitFeedback(data: Omit<PilotFeedbackSubmission, 'appVersion' | 'timestamp'>): Promise<PilotFeedbackSubmission> {
    const fullSubmission: PilotFeedbackSubmission = {
      ...data,
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      appVersion: '1.0.0-pilot',
      timestamp: Date.now(),
    };

    LoggingService.log('feedback_submitted', `Pilot feedback submitted in category: ${data.category}`, {
      category: data.category,
      gameId: data.gameId,
    });

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore not initialized');
      const feedbackRef = doc(collection(db, 'pilotFeedback'));
      await setDoc(feedbackRef, {
        ...fullSubmission,
        id: feedbackRef.id,
        createdAt: serverTimestamp(),
      });
      return { ...fullSubmission, id: feedbackRef.id };
    }

    // Mock Mode
    mockFeedbackInbox.unshift(fullSubmission);
    return fullSubmission;
  },

  /**
   * Returns mock feedback submissions (for testing)
   */
  getMockSubmissions(): PilotFeedbackSubmission[] {
    return [...mockFeedbackInbox];
  },

  clearMockSubmissions() {
    mockFeedbackInbox.length = 0;
  },
};
