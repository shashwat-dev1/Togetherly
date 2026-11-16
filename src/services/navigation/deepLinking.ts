/**
 * TOGETHERLY — DEEP LINKING ROUTER
 *
 * Handles URL scheme `togetherly://` navigation for partner invitations,
 * game sessions, daily challenges, and achievements.
 */

export interface ParsedDeepLink {
  route: string;
  params?: Record<string, string>;
  isValid: boolean;
  error?: string;
}

export const DeepLinkingService = {
  /**
   * Generates deep link URL for partner invitation.
   */
  createInviteLink(code: string): string {
    return `togetherly://pair?code=${encodeURIComponent(code)}`;
  },

  /**
   * Generates deep link URL for joining a game session.
   */
  createGameLink(gameId: string, sessionId: string): string {
    return `togetherly://game?gameId=${encodeURIComponent(gameId)}&sessionId=${encodeURIComponent(sessionId)}`;
  },

  /**
   * Generates deep link URL for daily challenge.
   */
  createDailyChallengeLink(dateStr?: string): string {
    return dateStr
      ? `togetherly://daily-challenge?date=${encodeURIComponent(dateStr)}`
      : 'togetherly://daily-challenge';
  },

  /**
   * Generates deep link URL for achievement details.
   */
  createAchievementLink(achievementId: string): string {
    return `togetherly://achievements?id=${encodeURIComponent(achievementId)}`;
  },

  /**
   * Parses an incoming deep link URL and determines the target Expo Router path.
   */
  parseDeepLink(url: string): ParsedDeepLink {
    if (
      !url ||
      typeof url !== 'string' ||
      (!url.startsWith('togetherly://') && !url.startsWith('https://togetherly.app'))
    ) {
      return { route: '/(tabs)/home', isValid: false, error: 'Unsupported URL or scheme' };
    }

    try {
      // Clean custom scheme
      const normalized = url.replace('togetherly://', 'https://togetherly.app/');
      const parsed = new URL(normalized);
      const path = parsed.pathname.replace(/^\//, '');
      const searchParams = parsed.searchParams;

      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      switch (path) {
        case 'pair':
        case 'invite': {
          const code = params.code;
          if (!code) {
            return { route: '/(onboarding)/pair', isValid: false, error: 'Missing code' };
          }
          return {
            route: '/(onboarding)/pair',
            params: { code: code.toUpperCase() },
            isValid: true,
          };
        }

        case 'game': {
          const { gameId, sessionId } = params;
          if (!gameId) {
            return { route: '/(tabs)/games', isValid: false, error: 'Missing gameId' };
          }
          return {
            route: '/game',
            params: { gameId, sessionId: sessionId || '' },
            isValid: true,
          };
        }

        case 'daily-challenge': {
          return {
            route: '/(tabs)/home',
            params: { focus: 'daily-challenge', ...(params.date ? { date: params.date } : {}) },
            isValid: true,
          };
        }

        case 'achievements': {
          return {
            route: '/(tabs)/our-world',
            params: { ...(params.id ? { selectedAchievementId: params.id } : {}) },
            isValid: true,
          };
        }

        case 'activity': {
          return {
            route: '/(tabs)/activity',
            isValid: true,
          };
        }

        default:
          return {
            route: '/(tabs)/home',
            isValid: true,
          };
      }
    } catch (err: any) {
      return {
        route: '/(tabs)/home',
        isValid: false,
        error: err.message || 'Invalid URL structure',
      };
    }
  },
};
