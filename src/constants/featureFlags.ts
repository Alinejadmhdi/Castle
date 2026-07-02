export const FEATURE_FLAGS = {
  REAL_MONEY_PLANTING: false,
  SOCIAL_FEED: false,
  LEADERBOARDS: false,
  MULTIPLE_TIMERS: false,
  CLOUD_SYNC: false,
  VIEW_MODE_3D: true,
  WIDGET: false,
  WATCH_COMPANION: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
