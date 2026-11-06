import { Platform } from 'react-native';

import { apiRequest } from './client';

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
  user: {
    id: number;
    login: string;
    email: string | null;
    name: string | null;
  };
};

export type City = {
  id: number;
  name: string;
};

export type House = {
  id: number;
  city_id: number;
  address: string;
};

export type Podjezd = {
  id: number;
  house_id: number;
  name: string;
};

export type Etazh = {
  id: number;
  podjezd_id: number;
  name: string;
};

export type Place = {
  id: number;
  etazh_id: number;
  name: string;
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
  mimeType: string;
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
    form.append(
      'photo',
      {
        uri: input.uri,
        name: input.fileName,
        type: input.mimeType,
      } as unknown as Blob,
    );
  }

  form.append('house_id', String(input.houseId));
  form.append('podjezd_id', String(input.podjezdId));
  form.append('etazh_id', String(input.etazhId));
  form.append('place_id', String(input.placeId));
  form.append('created_at', input.createdAt);

  await apiRequest('/photos', { method: 'POST', token, formData: form });
}
