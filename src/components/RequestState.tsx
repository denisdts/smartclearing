import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, radius, spacing } from '@/theme';

type RequestStateProps = {
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

export function RequestState({ isLoading, error, onRetry }: RequestStateProps) {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.text}>Загрузка…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Ionicons name="cloud-offline-outline" size={30} color={colors.warning} />
        <Text style={styles.text}>{error}</Text>
        <PrimaryButton
          title="Повторить"
          icon="refresh-outline"
          onPress={onRetry}
          style={styles.button}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
