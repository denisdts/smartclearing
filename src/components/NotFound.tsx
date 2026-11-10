import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { radius, spacing, type Palette } from '@/theme';
import { useThemedStyles } from '@/theme-provider';

type NotFoundProps = {
  message: string;
};

export function NotFound({ message }: NotFoundProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Данные не найдены</Text>
      <Text style={styles.message}>{message}</Text>
      <PrimaryButton
        title="К выбору дома"
        icon="home-outline"
        onPress={() => router.replace('/')}
        style={styles.button}
      />
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
      gap: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    message: {
      color: colors.textMuted,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
    },
    button: {
      alignSelf: 'stretch',
      borderRadius: radius.md,
    },
  });
