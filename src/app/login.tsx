import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';

import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!login.trim() || !password) {
      setError('Введите логин и пароль.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(login, password);
      router.replace('/');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setError('Неверный логин или пароль.');
        } else if (error.status === 422) {
          setError('Проверьте логин и пароль.');
        } else if (error.status === 0) {
          setError(error.message);
        } else {
          setError(error.message);
        }
      } else {
        setError('Не удалось войти. Попробуйте ещё раз.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = () => {
    Alert.alert(
      'Восстановление пароля',
      'Обратитесь в поддержку: support@smartclearing.ru — мы поможем восстановить доступ.',
      [{ text: 'Понятно' }],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll contentStyle={styles.content}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            accessibilityLabel="Логотип SmartClearing"
          />
          <Text style={styles.title}>SmartClearing</Text>
          <Text style={styles.subtitle}>
            Войдите, чтобы выбрать объект и синхронизировать фотографии.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Логин</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={colors.textMuted} />
            <TextInput
              value={login}
              onChangeText={setLogin}
              placeholder="Введите логин"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Пароль</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textMuted}
            />
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder="Введите пароль"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={() => {
                void handleSubmit();
              }}
              style={styles.input}
            />
            <Pressable
              accessibilityLabel={
                showPassword ? 'Скрыть пароль' : 'Показать пароль'
              }
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setShowPassword((value) => !value)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            title="Войти"
            icon="log-in-outline"
            loading={isSubmitting}
            onPress={() => {
              void handleSubmit();
            }}
            style={styles.submit}
          />

          <Pressable
            accessibilityRole="button"
            onPress={handleRestore}
            style={styles.restoreButton}
          >
            <Text style={styles.restoreText}>Восстановить пароль</Text>
          </Pressable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  submit: {
    marginTop: spacing.md,
  },
  restoreButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  restoreText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
