export type PhotoStatus = 'pending' | 'synced';

export type Photo = {
  id: string;
  name: string;
  place: string;
  placeId?: string;
  size?: string;
  uri?: string;
  status: PhotoStatus;
};

export const initialPhotos: Photo[] = [
  {
    id: 'photo-1',
    name: 'IMG_20261102_101512.jpg',
    place: 'Дом на Ленина · подъезд 1 · этаж 3 · место 02',
    size: '2,4 МБ',
    status: 'synced',
  },
  {
    id: 'photo-2',
    name: 'IMG_20261102_101744.jpg',
    place: 'Дом на Ленина · подъезд 1 · этаж 3 · место 03',
    size: '3,1 МБ',
    status: 'pending',
  },
  {
    id: 'photo-3',
    name: 'IMG_20261102_102103.jpg',
    place: 'Дом на Ленина · подъезд 2 · этаж 5 · место 01',
    size: '2,8 МБ',
    status: 'pending',
  },
  {
    id: 'photo-4',
    name: 'IMG_20261102_102355.jpg',
    place: 'Дом на Ленина · подъезд 2 · этаж 5 · место 04',
    size: '4,0 МБ',
    status: 'pending',
  },
  {
    id: 'photo-5',
    name: 'IMG_20261102_103012.jpg',
    place: 'Дом на Ленина · подъезд 3 · этаж 8 · место 06',
    size: '2,2 МБ',
    status: 'pending',
  },
];
