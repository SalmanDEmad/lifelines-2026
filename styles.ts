import { StyleSheet, I18nManager } from 'react-native';

export const COLORS = {
  primary: '#1976D2',
  text: '#212121',
  background: '#FFFFFF',
  border: '#BDBDBD',
  success: '#4CAF50',
  rubble: '#EF5350',
  hazard: '#FFA726',
  blocked_road: '#AB47BC',
  error: '#D32F2F',
  offline: '#FF6F00',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
};

export const SIZES = {
  buttonMin: 48,
  padding: 16,
  borderRadius: 8,
  padding_small: 8,
  padding_large: 24,
};

export const FONTS = {
  body: { fontSize: 14, lineHeight: 20, fontFamily: 'Poppins-Regular' },
  button: { fontSize: 16, fontWeight: '600' as '600', lineHeight: 24, fontFamily: 'Poppins-SemiBold' },
  title: { fontSize: 24, fontWeight: '700' as '700', lineHeight: 32, fontFamily: 'Poppins-Bold' },
  subtitle: { fontSize: 18, fontWeight: '600' as '600', lineHeight: 26, fontFamily: 'Poppins-SemiBold' },
};

// Helper to get RTL-aware text alignment
const getTextAlign = (align: 'left' | 'right' | 'center' = 'left'): any => {
  if (!I18nManager.isRTL) return align;
  if (align === 'left') return 'right';
  if (align === 'right') return 'left';
  return align;
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 70, // Account for tab bar (60px) + safe area
  },
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SIZES.padding,
    paddingBottom: 70, // Account for tab bar
  },
  button: {
    minHeight: SIZES.buttonMin,
    minWidth: SIZES.buttonMin,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding_small,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    ...FONTS.button,
    textAlign: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
  },
  title: {
    ...FONTS.title,
    color: COLORS.text,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  subtitle: {
    ...FONTS.subtitle,
    color: COLORS.text,
    marginBottom: SIZES.padding_small,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding_small,
    marginVertical: SIZES.padding_small,
    ...FONTS.body,
    color: COLORS.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  errorText: {
    color: COLORS.error,
    ...FONTS.body,
    marginTop: SIZES.padding_small,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  offlineBanner: {
    backgroundColor: COLORS.offline,
    paddingVertical: SIZES.padding_small,
    paddingHorizontal: SIZES.padding,
  },
  offlineBannerText: {
    color: COLORS.white,
    ...FONTS.button,
    textAlign: 'center',
  },
});
