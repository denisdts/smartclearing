import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

type HeaderAction = {
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const actions: HeaderAction[] = [
  {
    href: '/settings',
    icon: 'settings-outline',
    label: 'Настройки',
  },
  {
    href: '/about',
    icon: 'information-circle-outline',
    label: 'Описание',
  },
  {
    href: '/sync',
    icon: 'cloud-upload-outline',
    label: 'Синхронизация фотографий',
  },
];

export function HeaderActions() {
  const pathname = usePathname();

  return (
    <View style={styles.row}>
      {actions.map((action) => {
        const isActive = pathname === action.href;

        return (
          <Pressable
            key={action.label}
            accessibilityLabel={action.label}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              if (!isActive) {
                router.navigate(action.href);
              }
            }}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Ionicons
              name={action.icon}
              size={22}
              color={isActive ? colors.textMuted : colors.primary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
