/**
 * PawLink Theme - Based on Prototype Design System
 * Includes gradient colors, status colors, and component-specific palettes
 */

import { Platform } from 'react-native';

// ============================================================================
// GRADIENTS
// ============================================================================
export const Gradients = {
  blue: ['#3B82F6', '#2563EB'], // 首页
  purplePink: ['#A855F7', '#EC4899'], // 搜索页
  greenTeal: ['#10B981', '#14B8A6'], // 消息页
  indigoPurple: ['#6366F1', '#9333EA'], // 个人中心
  pinkRose: ['#EC4899', '#F43F5E'], // 社区页
  orangeAmber: ['#F59E0B', '#F59E0B'], // 志愿者页
};

// ============================================================================
// STATUS COLORS
// ============================================================================
export const StatusColors = {
  emergency: '#EF4444', // 紧急救助 - 红色
  adoption: '#3B82F6', // 待领养 - 蓝色
  fostered: '#10B981', // 临时寄养 - 绿色
  medical: '#A855F7', // 医疗众筹 - 紫色
  adopted: '#22C55E', // 已救助 - 深绿
  needsRescue: '#F59E0B', // 需救助 - 橙色
};

// ============================================================================
// UI COLORS
// ============================================================================
export const Colors = {
  light: {
    // Basic colors
    text: '#111827',
    textSecondary: '#6B7280',
    background: '#F9FAFB',
    surface: '#FFFFFF',

    // Primary action colors
    primary: '#3B82F6',
    primaryLight: '#DBEAFE',

    // Tab bar
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#3B82F6',

    // Borders and dividers
    border: '#E5E7EB',
    divider: '#F3F4F6',

    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Special states
    favorite: '#EF4444',
    bookmark: '#8B5CF6',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#111827',
    surface: '#1F2937',

    primary: '#60A5FA',
    primaryLight: '#1E3A8A',

    tabIconDefault: '#6B7280',
    tabIconSelected: '#60A5FA',

    border: '#374151',
    divider: '#1F2937',

    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',

    favorite: '#F87171',
    bookmark: '#A78BFA',
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ============================================================================
// PET TYPE COLORS
// ============================================================================
export const PetTypeColors = {
  cat: {
    bg: 'rgba(251, 146, 180, 0.15)',
    text: '#EC4899',
    border: '#F9A8D4',
  },
  dog: {
    bg: 'rgba(167, 139, 250, 0.15)',
    text: '#8B5CF6',
    border: '#C4B5FD',
  },
  other: {
    bg: 'rgba(96, 165, 250, 0.15)',
    text: '#3B82F6',
    border: '#93C5FD',
  },
};

// ============================================================================
// PET STATUS BADGES
// ============================================================================
export const PetStatusBadges = {
  emergency: {
    bg: '#FEE2E2',
    text: '#DC2626',
    icon: '#FCA5A5',
  },
  for_adoption: {
    bg: '#DBEAFE',
    text: '#2563EB',
    icon: '#93C5FD',
  },
  needs_rescue: {
    bg: '#FED7AA',
    text: '#EA580C',
    icon: '#FDBA74',
  },
  adopted: {
    bg: '#D1FAE5',
    text: '#059669',
    icon: '#6EE7B7',
  },
};
