import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { usePhotos } from '@/photos/PhotoContext';
import { colors, radius, spacing } from '@/theme';

const SYNC_INTERVAL_MS = 700;

export default function SyncScreen() {
  const { photos, markSynced, resetSynced } = usePhotos();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const queueRef = useRef<string[]>([]);

  const syncedCount = photos.filter((photo) => photo.status === 'synced').length;
  const pendingCount = photos.length - syncedCount;
  const progress = photos.length === 0 ? 0 : syncedCount / photos.length;

  useEffect(() => {
    if (!isSyncing) {
      return;
    }

    const finish = () => {
      setIsSyncing(false);
      setLastSync(new Date());
    };

    const interval = setInterval(() => {
      const nextId = queueRef.current.shift();

      if (!nextId) {
        clearInterval(interval);
        finish();
        return;
      }

      markSynced(nextId);

      if (queueRef.current.length === 0) {
        clearInterval(interval);
        finish();
      }
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isSyncing, markSynced]);

  const handleSync = () => {
    if (isSyncing) {
      return;
    }

    if (pendingCount === 0) {
      resetSynced();
      queueRef.current = photos.map((photo) => photo.id);
    } else {
      queueRef.current = photos
        .filter((photo) => photo.status === 'pending')
        .map((photo) => photo.id);
    }

    setIsSyncing(true);
  };

  return (
    <Screen scroll>
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Синхронизация фотографий</Text>
          <Text style={styles.progressPercent}>
            {Math.round(progress * 100)}%
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>

        <Text style={styles.progressMeta}>
          {syncedCount} из {photos.length} загружено
          {pendingCount > 0 ? ` · осталось ${pendingCount}` : ' · всё готово'}
        </Text>

        <Text style={styles.progressMeta}>
          {lastSync
            ? `Последняя синхронизация: ${lastSync.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : syncedCount > 0
              ? 'Часть фотографий уже загружена'
              : 'Фотографии ещё не синхронизированы'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Все фотографии</Text>

      {photos.length === 0 ? (
        <Text style={styles.empty}>
          Пока нет фотографий. Сделайте снимки на экране места.
        </Text>
      ) : (
        photos.map((photo) => {
          const isSynced = photo.status === 'synced';

          return (
            <View key={photo.id} style={styles.photoRow}>
              {photo.uri ? (
                <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
              ) : (
                <View
                  style={[
                    styles.photoIcon,
                    isSynced && styles.photoIconSynced,
                  ]}
                >
                  <Ionicons
                    name={isSynced ? 'cloud-done-outline' : 'image-outline'}
                    size={22}
                    color={isSynced ? colors.background : colors.primary}
                  />
                </View>
              )}

              <View style={styles.photoText}>
                <Text style={styles.photoName} numberOfLines={1}>
                  {photo.name}
                </Text>
                <Text style={styles.photoMeta} numberOfLines={2}>
                  {photo.place}
                  {photo.size ? ` · ${photo.size}` : ''}
                </Text>
              </View>

              <Text
                style={[
                  styles.status,
                  isSynced ? styles.statusSynced : styles.statusPending,
                ]}
              >
                {isSynced ? 'готово' : 'в очереди'}
              </Text>
            </View>
          );
        })
      )}

      <PrimaryButton
        title={
          isSyncing
            ? 'Синхронизация…'
            : pendingCount === 0
              ? 'Синхронизировать заново'
              : `Синхронизировать (${pendingCount})`
        }
        icon={isSyncing ? undefined : 'cloud-upload-outline'}
        loading={isSyncing}
        onPress={handleSync}
        style={styles.button}
      />

      <Text style={styles.hint}>
        В демо-режиме загрузка имитируется. Подключите API сервиса, чтобы
        отправлять реальные файлы.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  progressTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  progressPercent: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  progressMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  photoIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  photoIconSynced: {
    backgroundColor: colors.primary,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  photoText: {
    flex: 1,
    gap: 2,
  },
  photoName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  photoMeta: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusSynced: {
    color: colors.primary,
  },
  statusPending: {
    color: colors.warning,
  },
  button: {
    marginTop: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
