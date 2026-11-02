import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type OptionCardProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: string;
  badgeColor?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function OptionCard({
  title,
  subtitle,
  icon,
  badge,
  badgeColor = colors.textMuted,
  selected = false,
  disabled = false,
  onPress,
}: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
        pressed && !disabled && styles.cardPressed,
      ]}
    >
      {icon ? (
        <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
          <Ionicons
            name={icon}
            size={22}
            color={selected ? colors.background : colors.primary}
          />
        </View>
      ) : null}

      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {badge ? (
        <Text style={[styles.badge, { color: badgeColor }]}>{badge}</Text>
      ) : null}

      <Ionicons
        name={selected ? 'checkmark-circle' : 'chevron-forward'}
        size={22}
        color={selected ? colors.primary : colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  cardDisabled: {
    opacity: 0.45,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  iconBoxSelected: {
    backgroundColor: colors.primary,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
  },
});
