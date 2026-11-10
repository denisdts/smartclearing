import { Stack } from 'expo-router';

import { HeaderActions } from '@/components/HeaderActions';
import { useTheme } from '@/theme-provider';

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Выбор дома' }} />
      <Stack.Screen
        name="house/[houseId]/entrances"
        options={{ title: 'Выбор подъезда' }}
      />
      <Stack.Screen
        name="house/[houseId]/entrance/[entranceId]/floors"
        options={{ title: 'Выбор этажа' }}
      />
      <Stack.Screen
        name="house/[houseId]/entrance/[entranceId]/floor/[floorId]/places"
        options={{ title: 'Выбор места' }}
      />
      <Stack.Screen
        name="house/[houseId]/entrance/[entranceId]/floor/[floorId]/place/[placeId]"
        options={{ title: 'Фотографии места' }}
      />
      <Stack.Screen name="settings" options={{ title: 'Настройки' }} />
      <Stack.Screen name="about" options={{ title: 'Описание' }} />
      <Stack.Screen name="sync" options={{ title: 'Синхронизация фото' }} />
    </Stack>
  );
}
