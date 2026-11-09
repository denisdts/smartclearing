import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { usePhotos } from '@/photos/PhotoContext';
import { colors, radius, spacing } from '@/theme';

export default function SyncScreen() {
  const { session, signOut } = useAuth();
  const { photos, isLoading, uploadingId, uploadPending, removePhoto } =
    usePhotos();

  const [isUploading, setIsUploading] = useState(false);
  const [runTotal, setRunTotal] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const completed = Math.min(runTotal, Math.max(0, runTotal - photos.length));
  const progress = runTotal === 0 ? 0 : completed / runTotal;
  const failedCount = photos.filter((photo) => photo.status === 'failed').length;

  const handleUpload = async () => {
    if (!session || isUploading || photos.length === 0) {
      return;
    }

    setIsUploading(true);
    setNotice(null);
    setLastSync(null);
    setRunTotal(photos.length);

    const result = await uploadPending(session.token);

    setIsUploading(false);
    setLastSync(new Date());

    if (result.unauthorized) {
      Alert.alert('Сессия истекла', 'Войдите снова, чтобы продолжить загрузку.');
      await signOut();
      return;
    }

    if (result.failed > 0) {
      setNotice(
        `Не удалось загрузить ${result.failed}. Фотографии остались в очереди — повторите попытку.`,
      );
    }
  };

  return (
    <Screen scroll>
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Очередь фотографий</Text>
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
          {photos.length === 0
            ? 'Очередь пуста — все фотографии загружены'
            : `В очереди: ${photos.length}${
                failedCount > 0 ? ` · с ошибкой: ${failedCount}` : ''
              }`}
        </Text>

        <Text style={styles.progressMeta}>
          {lastSync
            ? `Последняя загрузка: ${lastSync.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : 'Загрузите очередь, когда появится соединение'}
        </Text>
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Text style={styles.sectionTitle}>Фотографии на устройстве</Text>

      {isLoading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.empty}>Загружаем очередь…</Text>
        </View>
      ) : photos.length === 0 ? (
        <Text style={styles.empty}>
          Пока нет фотографий. Сделайте снимки на экране места.
        </Text>
      ) : (
        photos.map((photo) => {
          const isActive = photo.id === uploadingId;
          const isFailed = photo.status === 'failed';

          return (
            <View key={photo.id} style={styles.photoRow}>
              <Image source={{ uri: photo.uri }} style={styles.thumbnail} />

              <View style={styles.photoText}>
                <Text style={styles.photoName} numberOfLines={1}>
                  {photo.fileName}
                </Text>
                <Text style={styles.photoMeta} numberOfLines={2}>
                  {photo.place}
                </Text>
                {isFailed && photo.error ? (
                  <Text style={styles.photoError} numberOfLines={2}>
                    {photo.error}
                  </Text>
                ) : null}
              </View>

              {isActive ? (
                <ActivityIndicator color={colors.primary} />
              ) : isFailed ? (
                <Text style={[styles.status, styles.statusFailed]}>ошибка</Text>
              ) : (
                <Text style={[styles.status, styles.statusPending]}>
                  в очереди
                </Text>
              )}

              <Pressable
                accessibilityLabel="Удалить из очереди"
                accessibilityRole="button"
                disabled={isUploading}
                hitSlop={8}
                onPress={() => {
                  void removePhoto(photo.id);
                }}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.pressed,
                  isUploading && styles.disabled,
                ]}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
          );
        })
      )}

      <PrimaryButton
        title={
          isUploading
            ? 'Загрузка…'
            : photos.length === 0
              ? 'Очередь пуста'
              : `Загрузить (${photos.length})`
        }
        icon={isUploading ? undefined : 'cloud-upload-outline'}
        loading={isUploading}
        disabled={photos.length === 0 || isLoading}
        onPress={() => {
          void handleUpload();
        }}
        style={styles.button}
      />

      <Text style={styles.hint}>
        Каждая фотография удаляется с устройства сразу после успешной загрузки
        в сервис.
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
  notice: {
    color: colors.warning,
    fontSize: 13,
    lineHeight: 19,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
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
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  photoError: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusPending: {
    color: colors.warning,
  },
  statusFailed: {
    color: colors.danger,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
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
