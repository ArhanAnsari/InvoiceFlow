// InvoiceFlow v2 — Design System
// Premium glassmorphism + material-inspired UI token system

export const Palette = {
  // Primary — Indigo Purple
  primary50: "#EEF2FF",
  primary100: "#E0E7FF",
  primary200: "#C7D2FE",
  primary400: "#818CF8",
  primary500: "#6C63FF",
  primary600: "#5B52E8",
  primary700: "#4F46E5",

  // Secondary — Teal Green (Paid / Success)
  secondary400: "#2DD4BF",
  secondary500: "#00D4AA",
  secondary600: "#00B896",

  // Danger — Coral Red
  danger400: "#FF7070",
  danger500: "#FF5757",
  danger600: "#E04545",

  // Warning — Amber
  warning400: "#FFC96B",
  warning500: "#FFB547",
  warning600: "#E89F30",

  // Neutral
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Dark surface palette
  dark900: "#0F0F1A",
  dark800: "#141423",
  dark700: "#1A1B2E",
  dark600: "#1E2035",
  dark500: "#252740",
  dark400: "#2D2F45",
  dark300: "#3A3C55",
};

export const Colors = {
  light: {
    // Backgrounds
    background: "#F5F7FA",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFFFF",
    surfaceOverlay: "rgba(255,255,255,0.72)",

    // Text
    text: "#1A1D2E",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    textInverse: "#FFFFFF",

    // Brand
    tint: Palette.primary500,
    primary: Palette.primary500,
    primaryLight: Palette.primary50,

    // Semantic
    success: Palette.secondary500,
    successBg: "#E6FBF5",
    danger: Palette.danger500,
    dangerBg: "#FFF0F0",
    warning: Palette.warning500,
    warningBg: "#FFF8EC",

    // UI
    border: "#E5E7EB",
    divider: "#F3F4F6",
    icon: "#6B7280",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: Palette.primary500,
    placeholder: "#9CA3AF",

    // Shadows
    shadowColor: "#000000",
  },
  dark: {
    background: "#0F0F1A",
    surface: "#1A1B2E",
    surfaceRaised: "#1E2035",
    surfaceOverlay: "rgba(15,15,26,0.80)",

    text: "#F1F2F6",
    textSecondary: "#A8AABC",
    textMuted: "#5C5F7A",
    textInverse: "#0F0F1A",

    tint: "#7C75FF",
    primary: "#7C75FF",
    primaryLight: "#2D2B4E",

    success: "#00E5B8",
    successBg: "#0A2A25",
    danger: "#FF6B6B",
    dangerBg: "#2A0F0F",
    warning: "#FFD166",
    warningBg: "#2A1F0A",

    border: "#2D2F45",
    divider: "#23243A",
    icon: "#A8AABC",
    tabIconDefault: "#5C5F7A",
    tabIconSelected: "#7C75FF",
    placeholder: "#5C5F7A",

    shadowColor: "#000000",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 56,
  "7xl": 64,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  overlay: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 60,
    elevation: 20,
  },
} as const;

export const Typography = {
  display: { fontSize: 32, fontWeight: "700" as const, letterSpacing: -0.5 },
  h1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.3 },
  h2: { fontSize: 24, fontWeight: "600" as const, letterSpacing: -0.2 },
  h3: { fontSize: 20, fontWeight: "600" as const },
  h4: { fontSize: 18, fontWeight: "600" as const },
  bodyLarge: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: "400" as const, lineHeight: 21 },
  bodySmall: { fontSize: 12, fontWeight: "400" as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.5 },
  mono: { fontSize: 14, fontFamily: "monospace" as const },
  monoLarge: {
    fontSize: 22,
    fontFamily: "monospace" as const,
    fontWeight: "700" as const,
  },
} as const;

// Gradient presets
export const Gradients = {
  primary: ["#6C63FF", "#9B8FFF"] as const,
  primaryDark: ["#4F46E5", "#7C75FF"] as const,
  success: ["#00D4AA", "#00F5C4"] as const,
  danger: ["#FF5757", "#FF8080"] as const,
  warning: ["#FFB547", "#FFD080"] as const,
  dark: ["#1A1B2E", "#0F0F1A"] as const,
  card: ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.7)"] as const,
  cardDark: ["rgba(30,32,53,0.9)", "rgba(26,27,46,0.7)"] as const,
} as const;
