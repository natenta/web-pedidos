import { CONFIG } from './config';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface Suggestion {
  displayName: string;
  lat: number;
  lng: number;
  /** Nombre de la calle si Nominatim lo devuelve */
  street?: string;
  /** Altura (número de puerta) */
  housenumber?: string;
  /** Barrio / suburbio */
  suburb?: string;
}

// ---------------------------------------------------------------------------
// Consulta a Nominatim (OpenStreetMap) para autocompletado de direcciones
// ---------------------------------------------------------------------------

let lastQueryTime = 0;

/**
 * Busca direcciones en OpenStreetMap usando el API de Nominatim.
 * Respeta la política de uso: máximo 1 request por segundo.
 * Filtra por país (AR) y ciudad (Buenos Aires).
 */
export async function searchAddress(query: string): Promise<Suggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 4) return [];

  // Rate limiting: respetar 1 request/segundo
  const now = Date.now();
  const elapsed = now - lastQueryTime;
  if (elapsed < 1100) {
    await new Promise(resolve => setTimeout(resolve, 1100 - elapsed));
  }
  lastQueryTime = Date.now();

  // Construimos los params a mano porque URLSearchParams escapa comas y eso rompe viewbox
  const params = [
    `q=${encodeURIComponent(trimmed)}`,
    `format=json`,
    `addressdetails=1`,
    `limit=${CONFIG.OSM_LIMIT}`,
    `countrycodes=${encodeURIComponent(CONFIG.OSM_COUNTRY_CODES)}`,
    // Sin city — conflictúa con q (free-form query)
    // viewbox: left,bottom,right,top  |  CABA aprox: lon -58.53..-58.33, lat -34.70..-34.53
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
  }));
}
