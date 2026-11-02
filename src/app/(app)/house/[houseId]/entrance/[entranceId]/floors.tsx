import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { NotFound } from '@/components/NotFound';
import { OptionCard } from '@/components/OptionCard';
import { Screen } from '@/components/Screen';
import { countFreePlaces, findEntrance, findHouse } from '@/data/buildings';
import { colors, spacing } from '@/theme';
import { plural } from '@/utils/plural';

export default function FloorsScreen() {
  const { houseId, entranceId } = useLocalSearchParams<{
    houseId: string;
    entranceId: string;
  }>();

  const house = findHouse(houseId);
  const entrance = findEntrance(house, entranceId);

  if (!house || !entrance) {
    return <NotFound message="Подъезд не найден. Вернитесь к выбору дома." />;
  }

  const floors = [...entrance.floors].reverse();

  return (
    <Screen scroll>
      <Text style={styles.context}>
        {house.name} · подъезд {entrance.number}
      </Text>
      <Text style={styles.hint}>Выберите этаж.</Text>

      {floors.map((floor) => {
        const free = countFreePlaces(floor);

        return (
          <OptionCard
            key={floor.id}
            icon="layers-outline"
            title={`Этаж ${floor.number}`}
            subtitle={`${floor.places.length} ${plural(floor.places.length, [
              'место',
              'места',
              'мест',
            ])} · ${free} ${plural(free, [
              'свободное',
              'свободных',
              'свободных',
            ])}`}
            onPress={() =>
              router.push({
                pathname:
                  '/house/[houseId]/entrance/[entranceId]/floor/[floorId]/places',
                params: {
                  houseId: house.id,
                  entranceId: entrance.id,
                  floorId: floor.id,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
});
