import Ionicons from '@expo/vector-icons/Ionicons';
import {
  CameraView,
  useCameraPermissions,
  type CameraType,
  type FlashMode,
} from 'expo-camera';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NotFound } from '@/components/NotFound';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { usePhotos } from '@/photos/PhotoContext';
import { radius, spacing, type Palette } from '@/theme';
import { useTheme, useThemedStyles } from '@/theme-provider';
import { parseId, singleParam } from '@/utils/params';

function toDisplayUri(uri: string): string {
  if (
    uri.startsWith('file:') ||
    uri.startsWith('http') ||
    uri.startsWith('data:') ||
    uri.startsWith('blob:')
  ) {
    return uri;
  }
  return `data:image/jpeg;base64,${uri}`;
}

export default function PlacePhotosScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{
    houseId: string;
    entranceId: string;
    floorId: string;
    placeId: string;
    houseAddress?: string;
    entranceName?: string;
    floorName?: string;
    placeName?: string;
  }>();

  const houseId = parseId(singleParam(params.houseId));
  const entranceId = parseId(singleParam(params.entranceId));
  const floorId = parseId(singleParam(params.floorId));
  const placeId = parseId(singleParam(params.placeId));
  const houseAddress = singleParam(params.houseAddress) ?? 'Дом';
  const entranceName = singleParam(params.entranceName) ?? 'Подъезд';
  const floorName = singleParam(params.floorName) ?? 'Этаж';
  const placeName = singleParam(params.placeName) ?? 'Место';

  const isFocused = useIsFocused();
  const { photos, addPhoto, removePhoto } = usePhotos();
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  if (
    houseId === null ||
    entranceId === null ||
    floorId === null ||
    placeId === null
  ) {
    return <NotFound message="Место не найдено. Вернитесь к выбору дома." />;
  }

  const placeLabel = `${houseAddress} · ${entranceName} · этаж ${floorName} · ${placeName}`;
  const placePhotos = photos.filter((photo) => photo.placeId === placeId);

  const handleCapture = async () => {
    if (!cameraRef.current || !isCameraReady || isCapturing) {
      return;
    }

    setIsCapturing(true);

    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.75,
      });

      if (picture?.uri) {
        await addPhoto({
          uri: toDisplayUri(picture.uri),
          place: placeLabel,
          houseId,
          podjezdId: entranceId,
          etazhId: floorId,
          placeId,
          capturedAt: new Date().toISOString(),
        });
      }
    } catch {
      Alert.alert('Не удалось сделать фото', 'Попробуйте снять ещё раз.');
    } finally {
      setIsCapturing(false);
    }
  };

  const renderCamera = () => {
    if (!permission) {
      return (
        <View style={styles.permissionCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.permissionText}>Проверяем доступ к камере…</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={32} color={colors.primary} />
          <Text style={styles.permissionTitle}>Нужен доступ к камере</Text>
          <Text style={styles.permissionText}>
            Без камеры нельзя сфотографировать место клиринга.
          </Text>
          {permission.canAskAgain ? (
            <PrimaryButton
              title="Разрешить камеру"
              icon="camera-outline"
              onPress={() => {
                void requestPermission();
              }}
            />
          ) : (
            <PrimaryButton
              title="Открыть настройки"
              icon="settings-outline"
              onPress={() => {
                void Linking.openSettings();
              }}
            />
          )}
        </View>
      );
    }

    if (cameraError) {
      return (
        <View style={styles.permissionCard}>
          <Ionicons name="warning-outline" size={32} color={colors.warning} />
          <Text style={styles.permissionTitle}>Камера недоступна</Text>
          <Text style={styles.permissionText}>{cameraError}</Text>
          <PrimaryButton
            title="Попробовать снова"
            icon="refresh-outline"
            onPress={() => setCameraError(null)}
          />
        </View>
      );
    }

    if (!isFocused) {
      return <View style={styles.cameraPlaceholder} />;
    }

    return (
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
          onCameraReady={() => setIsCameraReady(true)}
          onMountError={(event) => setCameraError(event.message)}
        />

        <View style={styles.cameraTopBar} pointerEvents="box-none">
          <Pressable
            accessibilityLabel="Переключить вспышку"
            accessibilityRole="button"
            onPress={() =>
              setFlash((current) => (current === 'off' ? 'on' : 'off'))
            }
            style={styles.cameraControl}
          >
            <Ionicons
              name={flash === 'off' ? 'flash-off-outline' : 'flash-outline'}
              size={20}
              color="#FFFFFF"
            />
          </Pressable>

          <Pressable
            accessibilityLabel="Сменить камеру"
            accessibilityRole="button"
            onPress={() =>
              setFacing((current) => (current === 'back' ? 'front' : 'back'))
            }
            style={styles.cameraControl}
          >
            <Ionicons
              name="camera-reverse-outline"
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <View style={styles.shutterRow} pointerEvents="box-none">
          <Pressable
            accessibilityLabel="Сделать фото"
            accessibilityRole="button"
            disabled={!isCameraReady || isCapturing}
            onPress={() => {
              void handleCapture();
            }}
            style={({ pressed }) => [
              styles.shutterOuter,
              pressed && styles.shutterPressed,
              (!isCameraReady || isCapturing) && styles.shutterDisabled,
            ]}
          >
            {isCapturing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <Screen scroll>
      <View style={styles.contextCard}>
        <Text style={styles.contextHouse}>{houseAddress}</Text>
        <Text style={styles.contextLine}>
          {entranceName} · этаж {floorName} · {placeName}
        </Text>
        <Text style={styles.contextMeta}>Место клиринга</Text>
      </View>

      {renderCamera()}

      <View style={styles.galleryHeader}>
        <Text style={styles.sectionTitle}>Фотографии места</Text>
        <Text style={styles.counter}>{placePhotos.length}</Text>
      </View>

      {placePhotos.length === 0 ? (
        <View style={styles.emptyGallery}>
          <Ionicons name="images-outline" size={26} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            Сделайте одно или несколько фото — они появятся здесь.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gallery}
        >
          {placePhotos.map((photo) => (
            <View key={photo.id} style={styles.thumbnailWrapper}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <Pressable
                accessibilityLabel="Удалить фото"
                accessibilityRole="button"
                hitSlop={6}
                onPress={() => {
                  void removePhoto(photo.id);
                }}
                style={styles.removeButton}
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <PrimaryButton
        title="Перейти к синхронизации"
        icon="cloud-upload-outline"
        disabled={photos.length === 0}
        onPress={() => router.push('/sync')}
        style={styles.syncButton}
      />

      <Text style={styles.hint}>
        Снимки попадают в очередь на устройстве и удаляются из неё после
        успешной загрузки на сервер.
      </Text>
    </Screen>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    contextCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 4,
    },
    contextHouse: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    contextLine: {
      color: colors.textMuted,
      fontSize: 14,
    },
    contextMeta: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    cameraWrapper: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: '#000000',
      aspectRatio: 3 / 4,
    },
    camera: {
      flex: 1,
    },
    cameraPlaceholder: {
      aspectRatio: 3 / 4,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    cameraTopBar: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cameraControl: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    shutterRow: {
      position: 'absolute',
      bottom: spacing.lg,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    shutterOuter: {
      width: 70,
      height: 70,
      borderRadius: radius.pill,
      borderWidth: 4,
      borderColor: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    shutterPressed: {
      opacity: 0.7,
    },
    shutterDisabled: {
      opacity: 0.5,
    },
    shutterInner: {
      width: 52,
      height: 52,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
    permissionCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.md,
    },
    permissionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },
    permissionText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    galleryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    counter: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
    },
    emptyGallery: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      padding: spacing.md,
    },
    emptyText: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    gallery: {
      gap: spacing.sm,
      paddingRight: spacing.md,
    },
    thumbnailWrapper: {
      width: 96,
      height: 96,
    },
    thumbnail: {
      width: '100%',
      height: '100%',
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
    },
    removeButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 24,
      height: 24,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    syncButton: {
      marginTop: spacing.sm,
    },
    hint: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
    },
  });
