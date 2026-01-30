import React, { useContext } from 'react';
import { 
  Text as GluestackText, 
  Heading as GluestackHeading,
  HStack as GluestackHStack,
  VStack as GluestackVStack,
  Box as GluestackBox,
  Pressable as GluestackPressable,
  ScrollView as GluestackScrollView
} from '@gluestack-ui/themed';

// Import the translation context directly from i18n
// We use a lazy import pattern to avoid circular dependencies
let translationContextCache: React.Context<any> | null = null;

const getTranslationContext = () => {
  if (!translationContextCache) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const i18n = require('../utils/i18n');
      translationContextCache = i18n.TranslationContext;
    } catch {
      return null;
    }
  }
  return translationContextCache;
};

// Safe hook that returns false if not in provider context
const useSafeRTL = () => {
  const context = getTranslationContext();
  if (!context) return false;
  
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const value = useContext(context);
    return value?.isRTL ?? false;
  } catch {
    return false;
  }
};

// RTL-aware Text component
export const Text = ({ textAlign, ...props }: any) => {
  const isRTL = useSafeRTL();
  
  // If textAlign is explicitly set, use it. Otherwise default to left for LTR, right for RTL
  const align = textAlign || (isRTL ? 'right' : 'left');
  
  return <GluestackText {...props} textAlign={align} />;
};

// RTL-aware Heading component
export const Heading = ({ textAlign, ...props }: any) => {
  const isRTL = useSafeRTL();
  
  // If textAlign is explicitly set, use it. Otherwise default to left for LTR, right for RTL
  const align = textAlign || (isRTL ? 'right' : 'left');
  
  return <GluestackHeading {...props} textAlign={align} />;
};

// RTL-aware HStack - uses flexDirection row-reverse for RTL
export const HStack = ({ style, ...props }: any) => {
  const isRTL = useSafeRTL();
  
  return (
    <GluestackHStack 
      {...props}
      style={[
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        style
      ]}
    />
  );
};

// VStack remains unchanged (vertical doesn't need RTL)
export const VStack = GluestackVStack;

// Box remains unchanged
export const Box = GluestackBox;

// Pressable remains unchanged
export const Pressable = GluestackPressable;

// ScrollView remains unchanged
export const ScrollView = GluestackScrollView;
