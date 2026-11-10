import Constants from 'expo-constants';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { useState } from 'react';

import { useAuth } from '@/auth/AuthContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { radius, spacing, type Palette } from '@/theme';
import { useTheme, useThemedStyles } from '@/theme-provider';

type ToggleRowProps = {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({ title, description, value, onChange }: ToggleRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { isDark, theme, setTheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [compress, setCompress] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const handleSignOut = () => {
    Alert.alert('Выйти из аккаунта?', 'Для продолжения потребуется войти снова.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <Text style={styles.sectionTitle}>Аккаунт</Text>
      <View style={styles.card}>
        <View style={styles.accountRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {session?.user.name?.[0]?.toUpperCase() ??
                session?.user.login?.[0]?.toUpperCase() ??
                'S'}
            </Text>
          </View>
          <View style={styles.accountText}>
            <Text style={styles.email} numberOfLines={1}>
              {session?.user.name || session?.user.login}
            </Text>
            <Text style={styles.rowDescription} numberOfLines={1}>
              {session?.user.email || 'Авторизован'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Оформление</Text>
      <View style={styles.card}>
        <ToggleRow
          title="Выбор темы"
          description={
            theme === 'dark'
              ? 'Тёмная тема'
              : 'Светлая тема'
          }
          value={isDark}
          onChange={(value) => setTheme(value ? 'dark' : 'light')}
        />
      </View>

      <Text style={styles.sectionTitle}>Синхронизация</Text>
      <View style={styles.card}>
        <ToggleRow
          title="Автосинхронизация"
          description="Отправлять новые фотографии сразу после съёмки"
          value={autoSync}
          onChange={setAutoSync}
        />
        <View style={styles.divider} />
        <ToggleRow
          title="Сжимать фото"
          description="Уменьшать размер перед загрузкой на сервер"
          value={compress}
          onChange={setCompress}
        />
      </View>

      <Text style={styles.sectionTitle}>Уведомления</Text>
      <View style={styles.card}>
        <ToggleRow
          title="Push-уведомления"
          description="Сообщения о статусе клиринга и синхронизации"
          value={notifications}
          onChange={setNotifications}
        />
      </View>

      <Text style={styles.sectionTitle}>Приложение</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.rowTitle}>Версия</Text>
          <Text style={styles.rowDescription}>{version}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.rowTitle}>Сервис</Text>
          <Text style={styles.rowDescription}>SmartClearing Cloud</Text>
        </View>
      </View>

      <PrimaryButton
        title="Выйти из аккаунта"
        icon="log-out-outline"
        variant="danger"
        onPress={handleSignOut}
        style={styles.signOut}
      />
    </Screen>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    sectionTitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: colors.background,
      fontSize: 20,
      fontWeight: '800',
    },
    accountText: {
      flex: 1,
      gap: 2,
    },
    email: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    toggleText: {
      flex: 1,
      gap: 2,
    },
    rowTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    rowDescription: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    signOut: {
      marginTop: spacing.lg,
    },
  });
