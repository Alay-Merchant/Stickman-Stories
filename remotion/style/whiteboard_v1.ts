/**
 * Shared, versioned visual tokens for the first whiteboard renderer.
 * Keep scene components on these values so renders remain reproducible.
 */
export const COLORS = {
  boardWhite: "#FAFAF7",
  ink: "#171717",
  charcoal: "#4A4A4A",
  blue: "#2F80ED",
  green: "#27AE60",
  red: "#EB5757",
  yellow: "#F2C94C",
} as const;

export const ACCENT = {
  blue: COLORS.blue,
  green: COLORS.green,
  red: COLORS.red,
  yellow: COLORS.yellow,
  none: COLORS.ink,
} as const;

export const STROKE = 8;
export const FPS = 30;

export const DIMS = {
  yt_long: { w: 1920, h: 1080 },
  yt_short: { w: 1080, h: 1920 },
  reel: { w: 1080, h: 1920 },
  tiktok: { w: 1080, h: 1920 },
} as const;

export type Target = keyof typeof DIMS;
export type AccentName = keyof typeof ACCENT;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
