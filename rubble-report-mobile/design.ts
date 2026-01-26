/**
 * Design System - Lifelines Gaza Disaster Reporting App
 * 
 * Centralized design tokens for consistent UI across the app.
 * Uses raw values compatible with Gluestack UI's style props.
 */

import {
  Blocks,
  AlertTriangle,
  Construction,
  MapPin,
  Check,
  RefreshCw,
  Camera,
  Clock,
  BarChart3,
  Trash2,
  Upload,
  WifiOff,
  ClipboardList,
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react-native';

// ============================================
// ICON EXPORTS (Lucide React Native)
// ============================================
export const Icons = {
  // Category icons
  Rubble: Blocks,
  Hazard: AlertTriangle,
  BlockedRoad: Construction,
  Location: MapPin,
  
  // Status icons
  Synced: Check,
  Pending: RefreshCw,
  
  // Action icons
  Camera: Camera,
  Upload: Upload,
  Delete: Trash2,
  
  // Info icons
  Clock: Clock,
  Stats: BarChart3,
  Offline: WifiOff,
  Empty: ClipboardList,
  Photo: ImageIcon,
} as const;

// ============================================
// SPACING SCALE (in pixels)
// ============================================
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

// ============================================
// COLOR PALETTE
// ============================================
export const COLORS = {
  // Primary brand
  primary: '#1976D2',
  primaryLight: '#42A5F5',
  primaryDark: '#1565C0',

  // Semantic colors
  success: '#4CAF50',
  successLight: '#81C784',
  warning: '#FF9800',
  error: '#D32F2F',
  errorLight: '#EF5350',

  // Category colors
  rubble: '#EF5350',
  hazard: '#FFA726',
  blocked_road: '#AB47BC',

  // Status colors
  offline: '#FF6F00',
  synced: '#4CAF50',
  pending: '#FF9800',

  // Neutral palette
  white: '#FFFFFF',
  black: '#000000',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceElevated: '#FAFAFA',

  // Text colors
  text: '#212121',
  textSecondary: '#757575',
  textMuted: '#9E9E9E',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Border colors
  border: '#E0E0E0',
  borderLight: '#EEEEEE',
  borderDark: '#BDBDBD',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

// ============================================
// BORDER RADII
// ============================================
export const RADII = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// ============================================
// TYPOGRAPHY
// ============================================
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const LINE_HEIGHTS = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const FONT_WEIGHTS = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ============================================
// SHADOWS / ELEVATION
// ============================================
export const SHADOWS = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

// ============================================
// LAYOUT CONSTANTS
// ============================================
export const LAYOUT = {
  screenPaddingHorizontal: SPACING.base,
  screenPaddingTop: SPACING.xl,
  screenPaddingBottom: SPACING.base,
  cardPadding: SPACING.base,
  sectionGap: SPACING.xl,
  itemGap: SPACING.sm,
  minTouchTarget: 44,
  tabBarHeight: 60,
} as const;

// ============================================
// COMPONENT-SPECIFIC STYLES
// ============================================
export const BUTTON_HEIGHTS = {
  sm: 36,
  md: 44,
  lg: 52,
} as const;

export const INPUT_HEIGHTS = {
  sm: 40,
  md: 48,
  lg: 56,
} as const;

export const ICON_SIZES = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

// ============================================
// CATEGORY STYLING
// ============================================
export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'rubble':
      return COLORS.rubble;
    case 'hazard':
      return COLORS.hazard;
    case 'blocked_road':
      return COLORS.blocked_road;
    default:
      return COLORS.primary;
  }
};

export const getCategoryIcon = (category: string): LucideIcon => {
  switch (category) {
    case 'rubble':
      return Icons.Rubble;
    case 'hazard':
      return Icons.Hazard;
    case 'blocked_road':
      return Icons.BlockedRoad;
    default:
      return Icons.Location;
  }
};

// ============================================
// STATUS STYLING
// ============================================
export const getStatusColor = (synced: boolean): string => {
  return synced ? COLORS.synced : COLORS.pending;
};

export const getStatusIcon = (synced: boolean): LucideIcon => {
  return synced ? Icons.Synced : Icons.Pending;
};
