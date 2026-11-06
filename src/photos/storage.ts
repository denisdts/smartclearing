import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { Photo } from '@/data/photos';

const QUEUE_FILE_NAME = 'smartclearing-photo-queue.json';
const PHOTOS_DIR_NAME = 'smartclearing-photos';

let writeQueue: Promise<void> = Promise.resolve();

function queueFile(): File {
  return new File(Paths.document, QUEUE_FILE_NAME);
}

function photosDirectory(): Directory {
  return new Directory(Paths.document, PHOTOS_DIR_NAME);
}

export async function persistCapturedPhoto(
  sourceUri: string,
  fileName: string,
): Promise<string> {
  if (Platform.OS === 'web') {
    return sourceUri;
  }

  const directory = photosDirectory();
  directory.create({ intermediates: true, idempotent: true });

  const destination = new File(directory, fileName);
  const source = new File(sourceUri);

  await source.copy(destination, { overwrite: true });

  return destination.uri;
}

export async function deletePhotoFile(uri: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // The file may already be gone or live outside the sandbox.
  }
}

export async function loadPhotoQueue(): Promise<Photo[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    const file = queueFile();
    if (!file.exists) {
      return [];
    }

    const raw = file.textSync();
    const parsed = JSON.parse(raw) as Photo[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((photo) => {
      if (!photo?.uri || !photo?.id) {
        return false;
      }

      try {
        return new File(photo.uri).exists;
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

export async function savePhotoQueue(photos: Photo[]): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const payload = JSON.stringify(photos);

  writeQueue = writeQueue.then(async () => {
    try {
      const file = queueFile();

      if (!file.exists) {
        file.create({ intermediates: true, overwrite: true });
      }

      await file.write(payload);
    } catch {
      // The in-memory queue keeps working even if persistence fails.
    }
  });

  await writeQueue;
}
