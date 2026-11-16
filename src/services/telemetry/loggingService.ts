/**
 * TOGETHERLY — OBSERVABILITY & DIAGNOSTIC LOGGING SERVICE
 *
 * Tracks critical lifecycle, multiplayer, and network synchronization events
 * without logging sensitive user data, passwords, tokens, or private answers.
 */

export type DiagnosticEventType =
  | 'auth_failure'
  | 'pairing_failure'
  | 'session_create_failure'
  | 'session_join_failure'
  | 'listener_error'
  | 'reconnect_attempt'
  | 'game_action_failure'
  | 'app_crash'
  | 'sync_warning'
  | 'feedback_submitted';

export interface DiagnosticLogEntry {
  id: string;
  timestamp: number;
  type: DiagnosticEventType;
  message: string;
  context?: Record<string, any>;
  appVersion: string;
}

// In-Memory ring buffer of the last 100 diagnostic entries
const MAX_LOG_ENTRIES = 100;
const diagnosticRingBuffer: DiagnosticLogEntry[] = [];

// Sensitive field denylist to prevent PII / secret leakage
const REDACTED_KEYS = new Set([
  'password',
  'token',
  'fcmtoken',
  'authtoken',
  'answer',
  'privateanswer',
  'secret',
  'apikey',
  'credentials',
]);

function sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
  if (!context) return undefined;
  const sanitized: Record<string, any> = {};

  for (const [key, val] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeContext(val);
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized;
}

export const LoggingService = {
  /**
   * Records a technical or diagnostic event.
   */
  log(
    type: DiagnosticEventType,
    message: string,
    context?: Record<string, any>
  ): DiagnosticLogEntry {
    const entry: DiagnosticLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type,
      message,
      context: sanitizeContext(context),
      appVersion: '1.0.0-pilot',
    };

    diagnosticRingBuffer.unshift(entry);
    if (diagnosticRingBuffer.length > MAX_LOG_ENTRIES) {
      diagnosticRingBuffer.pop();
    }

    // Console output formatted with diagnostic badge
    const prefix = `[Togetherly Telemetry] [${type.toUpperCase()}]`;
    if (type.includes('failure') || type.includes('crash') || type === 'listener_error') {
      console.warn(prefix, message, entry.context || '');
    } else {
      console.log(prefix, message, entry.context || '');
    }

    return entry;
  },

  /**
   * Helper shortcuts for common diagnostic categories
   */
  logAuthFailure(message: string, email?: string) {
    this.log('auth_failure', message, { emailMasked: email ? email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : undefined });
  },

  logPairingFailure(message: string, code?: string) {
    this.log('pairing_failure', message, { codeLength: code?.length });
  },

  logSessionFailure(type: 'create' | 'join' | 'action', gameId: string, message: string, extra?: Record<string, any>) {
    const eventType: DiagnosticEventType =
      type === 'create'
        ? 'session_create_failure'
        : type === 'join'
        ? 'session_join_failure'
        : 'game_action_failure';
    this.log(eventType, message, { gameId, ...extra });
  },

  logListenerError(sessionId: string, error: any) {
    this.log('listener_error', error?.message || 'Firestore snapshot listener encountered an error', {
      sessionId,
      errorCode: error?.code,
    });
  },

  logReconnectAttempt(sessionId: string, attemptNumber: number, delayMs: number) {
    this.log('reconnect_attempt', `Reconnecting to session ${sessionId} (attempt ${attemptNumber})`, {
      sessionId,
      attemptNumber,
      delayMs,
    });
  },

  /**
   * Returns recent sanitized diagnostic logs (useful for feedback attachment)
   */
  getRecentLogs(limitCount: number = 20): DiagnosticLogEntry[] {
    return diagnosticRingBuffer.slice(0, limitCount);
  },

  /**
   * Clears the in-memory log buffer (useful for testing)
   */
  clearLogs() {
    diagnosticRingBuffer.length = 0;
  },
};

