import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { initialPhotos, type Photo } from '@/data/photos';

type AddPhotoInput = {
  uri: string;
  place: string;
  placeId: string;
};

type PhotoContextValue = {
  photos: Photo[];
  addPhoto: (input: AddPhotoInput) => string;
  removePhoto: (id: string) => void;
  markSynced: (id: string) => void;
  resetSynced: () => void;
};

const PhotoContext = createContext<PhotoContextValue | null>(null);

export function PhotoProvider({ children }: PropsWithChildren) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);

  const addPhoto = useCallback((input: AddPhotoInput) => {
    const timestamp = Date.now();
    const id = `photo-${timestamp}-${Math.round(Math.random() * 1000)}`;
    const name = `IMG_${new Date(timestamp)
      .toISOString()
      .slice(0, 19)
      .replace(/[-:T]/g, '')}.jpg`;

    setPhotos((current) => [
      {
        id,
        name,
        place: input.place,
        placeId: input.placeId,
        uri: input.uri,
        status: 'pending',
      },
      ...current,
    ]);

    return id;
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((current) => current.filter((photo) => photo.id !== id));
  }, []);

  const markSynced = useCallback((id: string) => {
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === id ? { ...photo, status: 'synced' } : photo,
      ),
    );
  }, []);

  const resetSynced = useCallback(() => {
    setPhotos((current) =>
      current.map((photo) => ({ ...photo, status: 'pending' })),
    );
  }, []);

  const value = useMemo(
    () => ({ photos, addPhoto, removePhoto, markSynced, resetSynced }),
    [photos, addPhoto, removePhoto, markSynced, resetSynced],
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
