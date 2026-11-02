import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { NotFound } from '@/components/NotFound';
import { OptionCard } from '@/components/OptionCard';
import { Screen } from '@/components/Screen';
import {
  countFreePlaces,
  findEntrance,
  findFloor,
  findHouse,
} from '@/data/buildings';
import { colors, spacing } from '@/theme';

export default function PlacesScreen() {
  const { houseId, entranceId, floorId } = useLocalSearchParams<{
    houseId: string;
    entranceId: string;
    floorId: string;
  }>();

  const house = findHouse(houseId);
  const entrance = findEntrance(house, entranceId);
  const floor = findFloor(entrance, floorId);

  if (!house || !entrance || !floor) {
    return <NotFound message="Этаж не найден. Вернитесь к выбору дома." />;
  }

  const free = countFreePlaces(floor);

  return (
    <Screen scroll>
      <Text style={styles.context}>
        {house.name} · подъезд {entrance.number} · этаж {floor.number}
      </Text>
      <Text style={styles.hint}>
        Свободно {free} из {floor.places.length}. Нажмите на свободное место,
        чтобы сделать фотографии.
      </Text>

      {floor.places.map((place) => {
        const isOccupied = place.status === 'occupied';

        return (
          <OptionCard
            key={place.id}
            icon={isOccupied ? 'lock-closed-outline' : 'camera-outline'}
            title={place.label}
            subtitle={`${place.area.toFixed(1).replace('.', ',')} м²`}
            badge={isOccupied ? 'занято' : 'свободно'}
            badgeColor={isOccupied ? colors.textMuted : colors.primary}
            disabled={isOccupied}
            onPress={() =>
              router.push({
                pathname:
                  '/house/[houseId]/entrance/[entranceId]/floor/[floorId]/place/[placeId]',
                params: {
                  houseId: house.id,
                  entranceId: entrance.id,
                  floorId: floor.id,
                  placeId: place.id,
                },
              })
            }
          />
        );
      })}
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
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
});
