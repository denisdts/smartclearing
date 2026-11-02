export type PlaceStatus = 'free' | 'occupied';

export type Place = {
  id: string;
  label: string;
  area: number;
  status: PlaceStatus;
};

export type Floor = {
  id: string;
  number: number;
  places: Place[];
};

export type Entrance = {
  id: string;
  number: number;
  floors: Floor[];
};

export type House = {
  id: string;
  name: string;
  address: string;
  entrances: Entrance[];
};

type HouseSeed = {
  id: string;
  name: string;
  address: string;
  entranceCount: number;
  floorCount: number;
};

const PLACES_PER_FLOOR = 6;

const seeds: HouseSeed[] = [
  {
    id: 'house-1',
    name: 'Дом на Ленина',
    address: 'ул. Ленина, 12',
    entranceCount: 3,
    floorCount: 9,
  },
  {
    id: 'house-2',
    name: 'Северный квартал',
    address: 'пр-т Мира, 48',
    entranceCount: 4,
    floorCount: 12,
  },
  {
    id: 'house-3',
    name: 'Речной парк',
    address: 'наб. Реки, 7',
    entranceCount: 2,
    floorCount: 16,
  },
];

function buildPlaces(
  houseId: string,
  entranceNumber: number,
  floorNumber: number,
): Place[] {
  return Array.from({ length: PLACES_PER_FLOOR }, (_, index) => {
    const occupied =
      (houseId.length + entranceNumber + floorNumber + index) % 5 === 0;

    return {
      id: `${houseId}-e${entranceNumber}-f${floorNumber}-p${index + 1}`,
      label: `Место ${String(index + 1).padStart(2, '0')}`,
      area: 2.5 + index * 0.5,
      status: occupied ? 'occupied' : 'free',
    };
  });
}

function buildFloors(
  houseId: string,
  entranceNumber: number,
  floorCount: number,
): Floor[] {
  return Array.from({ length: floorCount }, (_, index) => {
    const floorNumber = index + 1;
    return {
      id: `${houseId}-e${entranceNumber}-f${floorNumber}`,
      number: floorNumber,
      places: buildPlaces(houseId, entranceNumber, floorNumber),
    };
  });
}

export const houses: House[] = seeds.map((seed) => ({
  id: seed.id,
  name: seed.name,
  address: seed.address,
  entrances: Array.from({ length: seed.entranceCount }, (_, index) => {
    const entranceNumber = index + 1;
    return {
      id: `${seed.id}-e${entranceNumber}`,
      number: entranceNumber,
      floors: buildFloors(seed.id, entranceNumber, seed.floorCount),
    };
  }),
}));

export function findHouse(houseId?: string): House | undefined {
  return houses.find((house) => house.id === houseId);
}

export function findEntrance(
  house: House | undefined,
  entranceId?: string,
): Entrance | undefined {
  return house?.entrances.find((entrance) => entrance.id === entranceId);
}

export function findFloor(
  entrance: Entrance | undefined,
  floorId?: string,
): Floor | undefined {
  return entrance?.floors.find((floor) => floor.id === floorId);
}

export function countFreePlaces(floor: Floor): number {
  return floor.places.filter((place) => place.status === 'free').length;
}
