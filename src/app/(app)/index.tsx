import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { OptionCard } from '@/components/OptionCard';
import { Screen } from '@/components/Screen';
import { houses } from '@/data/buildings';
import { colors, spacing } from '@/theme';
import { plural } from '@/utils/plural';

export default function HousesScreen() {
  const { session } = useAuth();

  return (
    <Screen scroll>
      <View style={styles.intro}>
        <Text style={styles.greeting}>Здравствуйте</Text>
        <Text style={styles.email} numberOfLines={1}>
          {session?.email}
        </Text>
        <Text style={styles.hint}>
          Выберите дом, в котором нужно провести клиринг.
        </Text>
      </View>

      <View style={styles.list}>
        {houses.map((house) => (
          <OptionCard
            key={house.id}
            icon="home-outline"
            title={house.name}
            subtitle={`${house.address} · ${house.entrances.length} ${plural(
              house.entrances.length,
              ['подъезд', 'подъезда', 'подъездов'],
            )}`}
            onPress={() =>
              router.push({
                pathname: '/house/[houseId]/entrances',
                params: { houseId: house.id },
              })
            }
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  email: {
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
});
