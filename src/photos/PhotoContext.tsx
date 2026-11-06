import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { ApiError } from '@/api/client';
import { uploadPhoto } from '@/api/catalog';
import type { Photo } from '@/data/photos';
import {
  deletePhotoFile,
  loadPhotoQueue,
  persistCapturedPhoto,
  savePhotoQueue,
} from './storage';

export type AddPhotoInput = {
  uri: string;
  place: string;
  houseId: number;
  podjezdId: number;
  etazhId: number;
  placeId: number;
  capturedAt?: string;
};

export type UploadSummary = {
  uploaded: number;
  failed: number;
  unauthorized: boolean;
};

type PhotoContextValue = {
  photos: Photo[];
  isLoading: boolean;
  uploadingId: string | null;
  addPhoto: (input: AddPhotoInput) => Promise<string>;
  removePhoto: (id: string) => Promise<void>;
  uploadPending: (token: string) => Promise<UploadSummary>;
};

const PhotoContext = createContext<PhotoContextValue | null>(null);

function createFileName(timestamp: number): string {
  return `IMG_${new Date(timestamp)
    .toISOString()
    .slice(0, 19)
    .replace(/[-:T]/g, '')}.jpg`;
}

export function PhotoProvider({ children }: PropsWithChildren) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const photosRef = useRef<Photo[]>([]);

  useEffect(() => {
    let active = true;

    loadPhotoQueue()
      .then((queue) => {
        if (!active) {
          return;
        }
        photosRef.current = queue;
        setPhotos(queue);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback(async (next: Photo[]) => {
    photosRef.current = next;
    setPhotos(next);
    await savePhotoQueue(next);
  }, []);

  const addPhoto = useCallback(
    async (input: AddPhotoInput) => {
      const timestamp = Date.now();
      const id = `photo-${timestamp}-${Math.round(Math.random() * 1000)}`;
      const fileName = createFileName(timestamp);

      let uri = input.uri;
      try {
        uri = await persistCapturedPhoto(input.uri, fileName);
      } catch {
        uri = input.uri;
      }

      const photo: Photo = {
        id,
        uri,
        fileName,
        place: input.place,
        houseId: input.houseId,
        podjezdId: input.podjezdId,
        etazhId: input.etazhId,
        placeId: input.placeId,
        capturedAt: input.capturedAt ?? new Date(timestamp).toISOString(),
        status: 'pending',
      };

      await commit([photo, ...photosRef.current]);

      return id;
    },
    [commit],
  );

  const removePhoto = useCallback(
    async (id: string) => {
      const photo = photosRef.current.find((item) => item.id === id);

      if (!photo) {
        return;
      }

      await deletePhotoFile(photo.uri);
      await commit(photosRef.current.filter((item) => item.id !== id));
    },
    [commit],
  );

  const uploadPending = useCallback(
    async (token: string): Promise<UploadSummary> => {
      const queue = [...photosRef.current];
      let uploaded = 0;
      let failed = 0;
      let unauthorized = false;

      for (const photo of queue) {
        setUploadingId(photo.id);

        try {
          await uploadPhoto(token, {
            uri: photo.uri,
            fileName: photo.fileName,
            houseId: photo.houseId,
            podjezdId: photo.podjezdId,
            etazhId: photo.etazhId,
            placeId: photo.placeId,
            createdAt: photo.capturedAt,
          });

          uploaded += 1;
          await deletePhotoFile(photo.uri);
          await commit(photosRef.current.filter((item) => item.id !== photo.id));
        } catch (error) {
          failed += 1;

          if (error instanceof ApiError && error.status === 401) {
            unauthorized = true;
            break;
          }

          const message =
            error instanceof ApiError
              ? error.message
              : error instanceof Error && error.message
                ? error.message
                : 'Не удалось загрузить фотографию';

          await commit(
            photosRef.current.map((item) =>
              item.id === photo.id
                ? { ...item, status: 'failed', error: message }
                : item,
            ),
          );
        }
      }

      setUploadingId(null);

      return { uploaded, failed, unauthorized };
    },
    [commit],
  );

  const value = useMemo(
    () => ({
      photos,
      isLoading,
      uploadingId,
      addPhoto,
      removePhoto,
      uploadPending,
    }),
    [photos, isLoading, uploadingId, addPhoto, removePhoto, uploadPending],
  );

  return (
    <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>
  );
}

export function usePhotos(): PhotoContextValue {
  const value = useContext(PhotoContext);
  if (!value) {
    throw new Error('usePhotos must be used within <PhotoProvider />');
  }
  return value;
}
