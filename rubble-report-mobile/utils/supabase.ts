import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://niwiwfngnejwqlulcuin.supabase.co';
const supabaseAnonKey = 'sb_publishable_2Tbbi5zeRDl02pz0mOCeXg_U9CynWGz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
