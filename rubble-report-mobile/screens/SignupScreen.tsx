import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Heading, Box } from '../components';
import { Input, InputField, Button, ButtonText, Radio, RadioGroup, RadioIndicator, RadioIcon, RadioLabel, CircleIcon } from '@gluestack-ui/themed';
import { Globe } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTranslation, Language } from '../utils/i18n';
import { COLORS, SIZES } from '../styles';

interface SignupScreenProps {
  onNavigateToLogin: () => void;
}

export default function SignupScreen({ onNavigateToLogin }: SignupScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'citizen' | 'ngo'>('citizen');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t, isRTL, language, setLanguage } = useTranslation();
  const insets = useSafeAreaInsets();

  const toggleLanguage = () => {
    const newLang: Language = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  };

  const handleSignup = async () => {
    if (!email || !password || !name || !phone) {
      Alert.alert(
        t('auth.error'),
        t('auth.fillAllFields')
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        t('auth.error'),
        t('auth.passwordTooShort')
      );
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name, phone, role);
      // Navigation handled by AuthContext + App.tsx
    } catch (error: any) {
      Alert.alert(
        t('auth.error'),
        error.message || t('auth.signupFailed')
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
          <Heading size="2xl" style={styles.title}>
            {t('auth.createAccount')}
          </Heading>
          <Text style={styles.subtitle}>
            {t('auth.joinCommunity')}
          </Text>
        </Box>

        <Box style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.name')}</Text>
            <Input variant="outline" size="lg" style={styles.input}>
              <InputField
                placeholder={t('auth.namePlaceholder')}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                textAlign={isRTL ? 'right' : 'left'}
              />
            </Input>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.phone')}</Text>
            <Input variant="outline" size="lg" style={styles.input}>
              <InputField
                placeholder={t('auth.phonePlaceholder')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                textAlign={isRTL ? 'right' : 'left'}
              />
            </Input>
          </View>

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
            <Text style={styles.hint}>{t('auth.passwordHint')}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.accountType')}</Text>
            <RadioGroup value={role} onChange={setRole}>
              <View style={styles.radioOption}>
                <Radio value="citizen">
                  <RadioIndicator>
                    <RadioIcon as={CircleIcon} />
                  </RadioIndicator>
                  <RadioLabel>
                    <View style={styles.radioContent}>
                      <Text style={styles.radioTitle}>{t('auth.citizen')}</Text>
                      <Text style={styles.radioDescription}>
                        {t('auth.citizenDescription')}
                      </Text>
                    </View>
                  </RadioLabel>
                </Radio>
              </View>

              <View style={styles.radioOption}>
                <Radio value="ngo">
                  <RadioIndicator>
                    <RadioIcon as={CircleIcon} />
                  </RadioIndicator>
                  <RadioLabel>
                    <View style={styles.radioContent}>
                      <Text style={styles.radioTitle}>{t('auth.ngo')}</Text>
                      <Text style={styles.radioDescription}>
                        {t('auth.ngoDescription')}
                      </Text>
                    </View>
                  </RadioLabel>
                </Radio>
              </View>
            </RadioGroup>
          </View>

          <Button
            size="lg"
            onPress={handleSignup}
            isDisabled={loading}
            style={styles.signupButton}
          >
            <ButtonText>
              {loading ? t('common.loading') : t('auth.signUp')}
            </ButtonText>
          </Button>

          <TouchableOpacity 
            onPress={onNavigateToLogin}
            style={styles.loginLink}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              {t('auth.haveAccount')}{' '}
              <Text style={styles.loginTextBold}>
                {t('auth.login')}
              </Text>
            </Text>
          </TouchableOpacity>
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
    marginBottom: 32,
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
  hint: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  radioOption: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radioContent: {
    marginLeft: 12,
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  radioDescription: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  signupButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  loginTextBold: {
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
