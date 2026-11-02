import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { NotFound } from '@/components/NotFound';
import { OptionCard } from '@/components/OptionCard';
import { Screen } from '@/components/Screen';
import { countFreePlaces, findHouse } from '@/data/buildings';
import { colors, spacing } from '@/theme';
import { plural } from '@/utils/plural';

export default function EntrancesScreen() {
  const { houseId } = useLocalSearchParams<{ houseId: string }>();
  const house = findHouse(houseId);

  if (!house) {
    return <NotFound message="Выбранный дом больше недоступен." />;
  }

  return (
    <Screen scroll>
      <Text style={styles.context}>{house.address}</Text>
      <Text style={styles.hint}>Выберите подъезд, в котором находится место.</Text>

      {house.entrances.map((entrance) => {
        const free = entrance.floors.reduce(
          (total, floor) => total + countFreePlaces(floor),
          0,
        );

        return (
          <OptionCard
            key={entrance.id}
            icon="enter-outline"
            title={`Подъезд ${entrance.number}`}
            subtitle={`${entrance.floors.length} ${plural(
              entrance.floors.length,
              ['этаж', 'этажа', 'этажей'],
            )} · ${free} ${plural(free, [
              'свободное место',
              'свободных места',
              'свободных мест',
            ])}`}
            onPress={() =>
              router.push({
                pathname: '/house/[houseId]/entrance/[entranceId]/floors',
                params: { houseId: house.id, entranceId: entrance.id },
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
});
