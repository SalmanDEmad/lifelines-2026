import React from 'react';
import { 
  Text as GluestackText, 
  Heading as GluestackHeading,
  HStack as GluestackHStack,
  VStack as GluestackVStack,
  Box as GluestackBox,
  Pressable as GluestackPressable,
  ScrollView as GluestackScrollView
} from '@gluestack-ui/themed';
import { useTranslation } from '../utils/i18n';

// RTL-aware Text component
export const Text = ({ textAlign, ...props }: any) => {
  const { isRTL } = useTranslation();
  
  // If textAlign is explicitly set, use it. Otherwise default to left for LTR, right for RTL
  const align = textAlign || (isRTL ? 'right' : 'left');
  
  return <GluestackText {...props} textAlign={align} />;
};

// RTL-aware Heading component
export const Heading = ({ textAlign, ...props }: any) => {
  const { isRTL } = useTranslation();
  
  // If textAlign is explicitly set, use it. Otherwise default to left for LTR, right for RTL
  const align = textAlign || (isRTL ? 'right' : 'left');
  
  return <GluestackHeading {...props} textAlign={align} />;
};

// RTL-aware HStack - uses flexDirection row-reverse for RTL
export const HStack = ({ style, ...props }: any) => {
  const { isRTL } = useTranslation();
  
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
