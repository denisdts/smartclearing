import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';

import { fetchEtazhi } from '@/api/catalog';
import { useAuth } from '@/auth/AuthContext';
import { NotFound } from '@/components/NotFound';
import { OptionCard } from '@/components/OptionCard';
import { RequestState } from '@/components/RequestState';
import { Screen } from '@/components/Screen';
import { useApiData } from '@/hooks/useApiData';
import { colors, spacing } from '@/theme';
import { parseId, singleParam } from '@/utils/params';

export default function FloorsScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{
    houseId: string;
    entranceId: string;
    houseAddress?: string;
    entranceName?: string;
  }>();

  const houseId = parseId(singleParam(params.houseId));
  const entranceId = parseId(singleParam(params.entranceId));
  const houseAddress = singleParam(params.houseAddress) ?? 'Дом';
  const entranceName = singleParam(params.entranceName) ?? 'Подъезд';

  const load = useCallback(
    (token: string) =>
      entranceId === null
        ? Promise.resolve([])
        : fetchEtazhi(token, entranceId),
    [entranceId],
  );

  const { data, error, isLoading, reload } = useApiData(
    load,
    session?.token ?? null,
    `etazhi-${entranceId ?? 'none'}`,
  );

  if (houseId === null || entranceId === null) {
    return <NotFound message="Подъезд не найден. Вернитесь к выбору дома." />;
  }

  const floors = data ?? [];

  return (
    <Screen scroll>
      <Text style={styles.context}>
        {houseAddress} · {entranceName}
      </Text>
      <Text style={styles.hint}>Выберите этаж.</Text>

      <RequestState isLoading={isLoading} error={error} onRetry={reload} />

      {!isLoading && !error
        ? floors.map((floor) => (
            <OptionCard
              key={floor.id}
              icon="layers-outline"
              title={`Этаж ${floor.name || floor.id}`}
              subtitle="Выбрать место"
              onPress={() =>
                router.push({
                  pathname:
                    '/house/[houseId]/entrance/[entranceId]/floor/[floorId]/places',
                  params: {
                    houseId: String(houseId),
                    entranceId: String(entranceId),
                    floorId: String(floor.id),
                    houseAddress,
                    entranceName,
                    floorName: floor.name || String(floor.id),
                  },
                })
              }
            />
          ))
        : null}

      {!isLoading && !error && floors.length === 0 ? (
        <Text style={styles.empty}>В этом подъезде нет доступных этажей.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  context: {
    color: colors.textMuted,
    fontSize: 14,
  },
  hint: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
