import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';

import { fetchPlaces } from '@/api/catalog';
import { useAuth } from '@/auth/AuthContext';
import { NotFound } from '@/components/NotFound';
import { OptionCard } from '@/components/OptionCard';
import { RequestState } from '@/components/RequestState';
import { Screen } from '@/components/Screen';
import { useApiData } from '@/hooks/useApiData';
import { spacing, type Palette } from '@/theme';
import { useThemedStyles } from '@/theme-provider';
import { parseId, singleParam } from '@/utils/params';

export default function PlacesScreen() {
  const { session } = useAuth();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{
    houseId: string;
    entranceId: string;
    floorId: string;
    houseAddress?: string;
    entranceName?: string;
    floorName?: string;
  }>();

  const houseId = parseId(singleParam(params.houseId));
  const entranceId = parseId(singleParam(params.entranceId));
  const floorId = parseId(singleParam(params.floorId));
  const houseAddress = singleParam(params.houseAddress) ?? 'Дом';
  const entranceName = singleParam(params.entranceName) ?? 'Подъезд';
  const floorName = singleParam(params.floorName) ?? 'Этаж';

  const load = useCallback(
    (token: string) =>
      floorId === null ? Promise.resolve([]) : fetchPlaces(token, floorId),
    [floorId],
  );

  const { data, error, isLoading, reload } = useApiData(
    load,
    session?.token ?? null,
    `places-${floorId ?? 'none'}`,
  );

  if (houseId === null || entranceId === null || floorId === null) {
    return <NotFound message="Этаж не найден. Вернитесь к выбору дома." />;
  }

  const places = data ?? [];

  return (
    <Screen scroll>
      <Text style={styles.context}>
        {houseAddress} · {entranceName} · этаж {floorName}
      </Text>
      <Text style={styles.hint}>
        Выберите место, чтобы сделать фотографии.
      </Text>

      <RequestState isLoading={isLoading} error={error} onRetry={reload} />

      {!isLoading && !error
        ? places.map((place) => (
            <OptionCard
              key={place.id}
              icon="camera-outline"
              title={place.name || `Место ${place.id}`}
              subtitle="Открыть фотографии"
              highlighted={place.photoexist === true}
              onPress={() =>
                router.push({
                  pathname:
                    '/house/[houseId]/entrance/[entranceId]/floor/[floorId]/place/[placeId]',
                  params: {
                    houseId: String(houseId),
                    entranceId: String(entranceId),
                    floorId: String(floorId),
                    placeId: String(place.id),
                    houseAddress,
                    entranceName,
                    floorName,
                    placeName: place.name || `Место ${place.id}`,
                  },
                })
              }
            />
          ))
        : null}

      {!isLoading && !error && places.length === 0 ? (
        <Text style={styles.empty}>На этом этаже нет доступных мест.</Text>
      ) : null}
    </Screen>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    context: {
      color: colors.textMuted,
      fontSize: 14,
    },
    hint: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 26,
      marginBottom: spacing.sm,
    },
    empty: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
  });
