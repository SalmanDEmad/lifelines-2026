import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Heading, Box } from '../components';
import { Input, InputField, Button, ButtonText } from '@gluestack-ui/themed';
import { Globe } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTranslation, Language } from '../utils/i18n';
import { COLORS, SIZES } from '../styles';

interface LoginScreenProps {
  onNavigateToSignup?: () => void;
  onSkip?: () => void;
}

export default function LoginScreen({ onNavigateToSignup, onSkip }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { t, isRTL, language, setLanguage } = useTranslation();
  const insets = useSafeAreaInsets();

  const toggleLanguage = () => {
    const newLang: Language = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        t('auth.error'),
        t('auth.fillAllFields')
      );
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // Navigation handled by AuthContext + App.tsx
    } catch (error: any) {
      Alert.alert(
        t('auth.error'),
        error.message || t('auth.loginFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Language Toggle */}
        <TouchableOpacity 
          onPress={toggleLanguage}
          style={styles.languageButton}
          disabled={loading}
        >
          <Globe size={20} color={COLORS.primary} />
          <Text style={styles.languageText}>
            {language === 'en' ? 'العربية' : 'English'}
          </Text>
        </TouchableOpacity>

        <Box style={styles.header}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoText}>أ</Text>
            </View>
            <Text style={styles.logoTitle}>Amal أمل</Text>
            <Text style={styles.logoSubtitle}>Mapping Gaza's Debris</Text>
          </View>
          <Heading size="2xl" style={styles.title}>
            {t('auth.welcome')}
          </Heading>
          <Text style={styles.subtitle}>
            {t('auth.loginToContinue')}
          </Text>
        </Box>

        <Box style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <Input variant="outline" size="lg" style={styles.input}>
              <InputField
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textAlign={isRTL ? 'right' : 'left'}
              />
            </Input>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <Input variant="outline" size="lg" style={styles.input}>
              <InputField
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                textAlign={isRTL ? 'right' : 'left'}
              />
            </Input>
          </View>

          <Button
            size="lg"
            onPress={handleLogin}
            isDisabled={loading}
            style={styles.loginButton}
          >
            <ButtonText>
              {loading ? t('common.loading') : t('auth.login')}
            </ButtonText>
          </Button>

          {onSkip && (
            <TouchableOpacity 
              onPress={onSkip}
              style={styles.skipButton}
              disabled={loading}
            >
              <Text style={styles.skipText}>
                {t('auth.skipLogin') || 'Continue Without Login'}
              </Text>
            </TouchableOpacity>
          )}

          {onNavigateToSignup && (
            <TouchableOpacity 
              onPress={onNavigateToSignup}
              style={styles.signupLink}
              disabled={loading}
            >
              <Text style={styles.signupText}>
                {t('auth.noAccount')}{' '}
                <Text style={styles.signupTextBold}>
                  {t('auth.signUp')}
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  header: {
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  logoSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  title: {
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    backgroundColor: '#fff',
  },
  loginButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  signupLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  signupTextBold: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 6,
    marginBottom: 16,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
