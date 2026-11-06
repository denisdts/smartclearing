export type PhotoStatus = 'pending' | 'failed';

export type Photo = {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  place: string;
  houseId: number;
  podjezdId: number;
  etazhId: number;
  placeId: number;
  capturedAt: string;
  status: PhotoStatus;
  error?: string;
};
