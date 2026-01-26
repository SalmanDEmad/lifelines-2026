import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This must run synchronously before app renders
const initRTL = () => {
  // Try to get saved language synchronously (won't work in first render)
  // But will work after app restarts
  I18nManager.allowRTL(true);
  
  // Check if we have a saved preference
  AsyncStorage.getItem('app-language').then((savedLanguage) => {
    const shouldBeRTL = savedLanguage === 'ar';
    const currentlyRTL = I18nManager.isRTL;
    
    if (shouldBeRTL !== currentlyRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      // Will require app restart to take effect
    }
  });
};

initRTL();
