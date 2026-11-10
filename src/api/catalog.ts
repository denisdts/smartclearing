import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { apiRequest } from './client';

export type SessionUserResponse = {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
  refresh_token?: string;
  refresh_expires_in?: number;
  refresh_expires_at?: string;
  user: SessionUserResponse;
};

export type RefreshResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
  refresh_token?: string;
  refresh_expires_in?: number;
  refresh_expires_at?: string;
  user?: SessionUserResponse;
};

export type City = {
  id: number;
  name: string;
};

export type House = {
  id: number;
  city_id: number;
  address: string;
  photoexist?: boolean;
};

export type Podjezd = {
  id: number;
  house_id: number;
  name: string;
  photoexist?: boolean;
};

export type Etazh = {
  id: number;
  podjezd_id: number;
  name: string;
  photoexist?: boolean;
};

export type Place = {
  id: number;
  etazh_id: number;
  name: string;
  photoexist?: boolean;
};

type DataResponse<T> = {
  data: T;
};

export async function loginRequest(
  login: string,
  password: string,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { login, password },
  });
}

export async function refreshRequest(
  refreshToken: string,
): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
}

export async function registerPushTokenRequest(
  token: string,
  authToken: string,
  platform: string,
): Promise<void> {
  await apiRequest('/push-tokens', {
    method: 'POST',
    token: authToken,
    body: { token, platform },
  });
}

export async function unregisterPushTokenRequest(
  token: string,
  authToken: string,
): Promise<void> {
  await apiRequest('/push-tokens', {
    method: 'DELETE',
    token: authToken,
    body: { token },
  });
}

export async function fetchCities(token: string): Promise<City[]> {
  const response = await apiRequest<DataResponse<City[]>>('/cities', { token });
  return response.data;
}

export async function fetchHouses(
  token: string,
  cityId: number,
): Promise<House[]> {
  const response = await apiRequest<DataResponse<House[]>>(
    `/cities/${cityId}/houses`,
    { token },
  );
  return response.data;
}

export async function fetchPodjezdy(
  token: string,
  houseId: number,
): Promise<Podjezd[]> {
  const response = await apiRequest<DataResponse<Podjezd[]>>(
    `/houses/${houseId}/podjezdy`,
    { token },
  );
  return response.data;
}

export async function fetchEtazhi(
  token: string,
  podjezdId: number,
): Promise<Etazh[]> {
  const response = await apiRequest<DataResponse<Etazh[]>>(
    `/podjezdy/${podjezdId}/etazhi`,
    { token },
  );
  return response.data;
}

export async function fetchPlaces(
  token: string,
  etazhId: number,
): Promise<Place[]> {
  const response = await apiRequest<DataResponse<Place[]>>(
    `/etazhi/${etazhId}/places`,
    { token },
  );
  return response.data;
}

export type UploadPhotoInput = {
  uri: string;
  fileName: string;
  houseId: number;
  podjezdId: number;
  etazhId: number;
  placeId: number;
  createdAt: string;
};

export async function uploadPhoto(
  token: string,
  input: UploadPhotoInput,
): Promise<void> {
  const form = new FormData();

  if (Platform.OS === 'web') {
    const blob = await (await fetch(input.uri)).blob();
    form.append('photo', blob, input.fileName);
  } else {
    const file = new File(input.uri);
    form.append('photo', file as unknown as Blob);
  }

  form.append('house_id', String(input.houseId));
  form.append('podjezd_id', String(input.podjezdId));
  form.append('etazh_id', String(input.etazhId));
  form.append('place_id', String(input.placeId));
  form.append('created_at', input.createdAt);

  await apiRequest('/photos', { method: 'POST', token, formData: form });
}
