import { CONFIG } from './config';
import type { ShippingZone } from './types';

export interface Suggestion {
  displayName: string;
  lat: number;
  lng: number;
  street?: string;
  housenumber?: string;
  suburb?: string;
  isCaba?: boolean;
}

export interface ShippingResult {
  zone: ShippingZone;
  distanceKm: number;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function resolveShippingZone(suggestion: Suggestion): ShippingResult {
  const distanceKm = calculateDistance(
    CONFIG.REFERENCE_POINT.lat,
    CONFIG.REFERENCE_POINT.lng,
    suggestion.lat,
    suggestion.lng
  );

  if (distanceKm <= CONFIG.FREE_DELIVERY_RADIUS_KM) {
    return { zone: 'within_3km', distanceKm: Math.round(distanceKm * 10) / 10 };
  }

  if (suggestion.isCaba) {
    return { zone: 'caba', distanceKm: Math.round(distanceKm * 10) / 10 };
  }

  return { zone: 'outside_caba', distanceKm: Math.round(distanceKm * 10) / 10 };
}

let lastQueryTime = 0;

export async function searchAddress(query: string): Promise<Suggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 4) return [];

  const now = Date.now();
  const elapsed = now - lastQueryTime;
  if (elapsed < 1100) {
    await new Promise(resolve => setTimeout(resolve, 1100 - elapsed));
  }
  lastQueryTime = Date.now();

  const params = [
    `q=${encodeURIComponent(trimmed)}`,
    `format=json`,
    `addressdetails=1`,
    `limit=${CONFIG.OSM_LIMIT}`,
    `countrycodes=${encodeURIComponent(CONFIG.OSM_COUNTRY_CODES)}`,
    `bounded=1`,
    `viewbox=-58.5316,-34.7035,-58.3352,-34.5272`,
  ].join('&');

  const url = `https://nominatim.openstreetmap.org/search?${params}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'NatentaWebPedidos/1.0 (pedidos@natenta.com)',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    console.warn('[geo.ts] Nominatim respondió con error:', response.status);
    return [];
  }

  const data: any[] = await response.json();

  return data.map((item: any): Suggestion => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    street: item.address?.road ?? item.address?.pedestrian ?? undefined,
    housenumber: item.address?.house_number ?? undefined,
    suburb: item.address?.suburb ?? item.address?.neighbourhood ?? undefined,
    isCaba: item.display_name.toLowerCase().includes('ciudad autónoma de buenos aires') ||
            item.address?.city?.toLowerCase().includes('buenos aires') ||
            item.address?.state?.toLowerCase().includes('ciudad autónoma'),
  }));
}
