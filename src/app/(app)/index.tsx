import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { fetchCities, fetchHouses } from '@/api/catalog';
import { useAuth } from '@/auth/AuthContext';
import { OptionCard } from '@/components/OptionCard';
import { RequestState } from '@/components/RequestState';
import { Screen } from '@/components/Screen';
import { useApiData } from '@/hooks/useApiData';
import { radius, spacing, type Palette } from '@/theme';
import { useThemedStyles } from '@/theme-provider';

type HouseItem = {
  id: number;
  cityName: string;
  address: string;
  photoexist: boolean;
};

async function loadHouses(token: string): Promise<HouseItem[]> {
  const cities = await fetchCities(token);
  const groups = await Promise.all(
    cities.map(async (city) => {
      const houses = await fetchHouses(token, city.id);
      return houses.map((house) => ({
        id: house.id,
        cityName: city.name,
        address: house.address,
        photoexist: house.photoexist === true,
      }));
    }),
  );

  return groups.flat();
}

export default function HousesScreen() {
  const { session } = useAuth();
  const styles = useThemedStyles(createStyles);
  const { data, error, isLoading, reload } = useApiData(
    loadHouses,
    session?.token ?? null,
    'houses',
  );

  const houses = data ?? [];
  const userName = session?.user.name || session?.user.login || session?.user.email;

  return (
    <Screen scroll>
      <View style={styles.intro}>
        <Text style={styles.greeting}>Здравствуйте</Text>
        <Text style={styles.name} numberOfLines={1}>
          {userName}
        </Text>
        <Text style={styles.hint}>
          Выберите дом, в котором нужно провести клиринг.
        </Text>
      </View>

      <RequestState isLoading={isLoading} error={error} onRetry={reload} />

      {!isLoading && !error ? (
        houses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              У вас пока нет доступных домов. Обратитесь к администратору
              сервиса.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {houses.map((house) => (
              <OptionCard
                key={house.id}
                icon="home-outline"
                title={house.address}
                subtitle={house.cityName}
                highlighted={house.photoexist}
                onPress={() =>
                  router.push({
                    pathname: '/house/[houseId]/entrances',
                    params: {
                      houseId: String(house.id),
                      houseAddress: house.address,
                    },
                  })
                }
              />
            ))}
          </View>
        )
      ) : null}
    </Screen>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    intro: {
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    greeting: {
      color: colors.textMuted,
      fontSize: 14,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    name: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    hint: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      marginTop: spacing.sm,
    },
    list: {
      gap: spacing.sm,
    },
    empty: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
  });
