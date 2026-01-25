import React from 'react';
import { Text as RNText, StyleSheet, TextProps } from 'react-native';
import { I18nManager } from 'react-native';

/**
 * Custom Text component that automatically handles RTL text alignment
 * Wraps React Native's Text component and applies appropriate text direction
 * 
 * Usage:
 *   <Text>Simple text</Text>
 *   <Text style={{ fontSize: 16 }}>Styled text</Text>
 *   <Text numberOfLines={1}>Truncated text</Text>
 */
export const Text = React.forwardRef<RNText, TextProps>((props, ref) => {
  const { style, ...restProps } = props;

  // Convert style to array if it's an object or single value
  const styleArray = Array.isArray(style) ? style : style ? [style] : [];

  // Get the current text alignment from existing styles
  const mergedStyle = StyleSheet.flatten(styleArray);
  const currentTextAlign = mergedStyle?.textAlign as string | undefined;

  // Determine the final text alignment
  let finalTextAlign = currentTextAlign || 'auto';
  
  // Apply RTL-aware text alignment if in RTL mode and alignment is specified
  if (I18nManager.isRTL && currentTextAlign) {
    if (currentTextAlign === 'left') {
      finalTextAlign = 'right';
    } else if (currentTextAlign === 'right') {
      finalTextAlign = 'left';
    }
  }

  // Create the final style with RTL-adjusted text alignment
  const finalStyle = [
    ...styleArray,
    {
      textAlign: finalTextAlign as any,
      writingDirection: I18nManager.isRTL ? ('rtl' as any) : ('ltr' as any),
    },
  ];

  return <RNText ref={ref} style={finalStyle} {...restProps} />;
});

Text.displayName = 'RTLText';
