import Constants from 'expo-constants';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors, radius, spacing } from '@/theme';

const steps = [
  'Войдите в аккаунт или восстановите пароль.',
  'Выберите дом, подъезд и этаж.',
  'Отметьте место на этаже.',
  'Сфотографируйте место и синхронизируйте снимки с сервисом.',
];

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          accessibilityLabel="Логотип SmartClearing"
        />
        <Text style={styles.title}>SmartClearing</Text>
        <Text style={styles.subtitle}>
          Мобильный помощник для осмотра и клиринга помещений: фиксируйте
          состояние мест и передавайте фотографии в сервис.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Как это работает</Text>
        {steps.map((step, index) => (
          <View key={step} style={styles.step}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Данные</Text>
        <Text style={styles.paragraph}>
          Выбранные дом, подъезд, этаж и место сохраняются в приложении. Все
          фотографии отправляются в защищённое хранилище сервиса и доступны
          только авторизованным сотрудникам.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Поддержка</Text>
        <Text style={styles.paragraph}>support@smartclearing.ru</Text>
        <Text style={styles.paragraph}>Версия приложения {version}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    paddingTop: 2,
  },
  paragraph: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
