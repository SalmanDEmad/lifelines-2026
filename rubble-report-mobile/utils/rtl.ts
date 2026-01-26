import { I18nManager } from 'react-native';

/**
 * RTL utilities for handling right-to-left layout and text direction
 */

export type TextAlignment = 'left' | 'right' | 'center' | 'justify' | 'auto';

/**
 * Get text alignment based on current RTL setting
 * In RTL mode: 'left' becomes 'right', vice versa
 * 'center' and 'justify' remain the same
 */
export const getTextAlign = (alignment: TextAlignment = 'auto'): TextAlignment => {
  if (!I18nManager.isRTL) {
    return alignment;
  }

  switch (alignment) {
    case 'left':
      return 'right';
    case 'right':
      return 'left';
    case 'center':
    case 'justify':
    case 'auto':
    default:
      return alignment;
  }
};

/**
 * Get flex direction based on RTL setting
 * In RTL mode: 'row' becomes 'row-reverse', vice versa
 */
export const getFlexDirection = (direction: 'row' | 'column' = 'row'): 'row' | 'column' | 'row-reverse' | 'column-reverse' => {
  if (!I18nManager.isRTL) {
    return direction;
  }

  switch (direction) {
    case 'row':
      return 'row-reverse';
    case 'column':
      return 'column';
    default:
      return direction;
  }
};

/**
 * Get alignment for flex items (align-items property)
 * In RTL mode: 'flex-start' becomes 'flex-end', vice versa
 */
export const getAlignItems = (alignment: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' = 'flex-start'): string => {
  if (!I18nManager.isRTL) {
    return alignment;
  }

  switch (alignment) {
    case 'flex-start':
      return 'flex-end';
    case 'flex-end':
      return 'flex-start';
    case 'center':
    case 'stretch':
    case 'baseline':
    default:
      return alignment;
  }
};

/**
 * Get justification based on RTL setting
 * In RTL mode: 'flex-start' becomes 'flex-end', vice versa
 */
export const getJustifyContent = (justification: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' = 'flex-start'): string => {
  if (!I18nManager.isRTL) {
    return justification;
  }

  switch (justification) {
    case 'flex-start':
      return 'flex-end';
    case 'flex-end':
      return 'flex-start';
    case 'center':
    case 'space-between':
    case 'space-around':
    case 'space-evenly':
    default:
      return justification;
  }
};

/**
 * Get margin adjustment for RTL
 * Use marginHorizontal or marginLeft/marginRight directly
 */
export const getMarginHorizontal = (value: number): { marginHorizontal: number } => {
  return { marginHorizontal: value };
};

/**
 * Get padding adjustment for RTL
 * Use paddingHorizontal or paddingLeft/paddingRight directly
 */
export const getPaddingHorizontal = (value: number): { paddingHorizontal: number } => {
  return { paddingHorizontal: value };
};
