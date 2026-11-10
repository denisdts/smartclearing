import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';

import { fetchPodjezdy } from '@/api/catalog';
import { useAuth } from '@/auth/AuthContext';
import { NotFound } from '@/components/NotFound';
import { OptionCard } from '@/components/OptionCard';
import { RequestState } from '@/components/RequestState';
import { Screen } from '@/components/Screen';
import { useApiData } from '@/hooks/useApiData';
import { spacing, type Palette } from '@/theme';
import { useThemedStyles } from '@/theme-provider';
import { parseId, singleParam } from '@/utils/params';

export default function EntrancesScreen() {
  const { session } = useAuth();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{
    houseId: string;
    houseAddress?: string;
  }>();

  const houseId = parseId(singleParam(params.houseId));
  const houseAddress = singleParam(params.houseAddress) ?? 'Выбранный дом';

  const load = useCallback(
    (token: string) =>
      houseId === null ? Promise.resolve([]) : fetchPodjezdy(token, houseId),
    [houseId],
  );

  const { data, error, isLoading, reload } = useApiData(
    load,
    session?.token ?? null,
    `podjezdy-${houseId ?? 'none'}`,
  );

  if (houseId === null) {
    return <NotFound message="Выбранный дом больше недоступен." />;
  }

  const entrances = data ?? [];

  return (
    <Screen scroll>
      <Text style={styles.context}>{houseAddress}</Text>
      <Text style={styles.hint}>Выберите подъезд, в котором находится место.</Text>

      <RequestState isLoading={isLoading} error={error} onRetry={reload} />

      {!isLoading && !error
        ? entrances.map((entrance) => (
            <OptionCard
              key={entrance.id}
              icon="enter-outline"
              title={entrance.name || `Подъезд ${entrance.id}`}
              subtitle="Выбрать этаж"
              highlighted={entrance.photoexist === true}
              onPress={() =>
                router.push({
                  pathname: '/house/[houseId]/entrance/[entranceId]/floors',
                  params: {
                    houseId: String(houseId),
                    entranceId: String(entrance.id),
                    houseAddress,
                    entranceName: entrance.name || `Подъезд ${entrance.id}`,
                  },
                })
              }
            />
          ))
        : null}

      {!isLoading && !error && entrances.length === 0 ? (
        <Text style={styles.empty}>В этом доме нет доступных подъездов.</Text>
      ) : null}
    </Screen>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    context: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    hint: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: spacing.sm,
    },
    empty: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
  });
