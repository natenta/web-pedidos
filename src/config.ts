import { Topping } from './models/Topping';

export const CONFIG = {
  WHATSAPP_NUMBER: import.meta.env.VITE_WHATSAPP_NUMBER || '5491126515156',
  MIN_DELIVERY_AMOUNT: Number(import.meta.env.VITE_MIN_DELIVERY_AMOUNT) || 10000,
  DELIVERY_DAYS: (import.meta.env.VITE_DELIVERY_DAYS || 'Viernes,Sábado').split(','),
  PICKUP_DAYS: (import.meta.env.VITE_PICKUP_DAYS || 'Martes,Jueves').split(','),

  // OpenStreetMap / Nominatim
  OSM_COUNTRY_CODES: import.meta.env.VITE_OSM_COUNTRY_CODES || 'ar',
  OSM_LIMIT: Number(import.meta.env.VITE_OSM_LIMIT) || 5,
  BASE_PRICES: {
    Chica: 5900,
    Grande: 8900
  },
  TOPPING_EXTRA_PRICES: {
    Común: {
      Chica: Number(import.meta.env.VITE_TOPPING_EXTRA_COMUN_CHICA) || 400,
      Grande: Number(import.meta.env.VITE_TOPPING_EXTRA_COMUN_GRANDE) || 800
    },
    Premium: {
      Chica: Number(import.meta.env.VITE_TOPPING_EXTRA_PREMIUM_CHICA) || 1000,
      Grande: Number(import.meta.env.VITE_TOPPING_EXTRA_PREMIUM_GRANDE) || 2000
    },
    Deluxe: {
      Chica: Number(import.meta.env.VITE_TOPPING_EXTRA_DELUXE_CHICA) || 2000,
      Grande: Number(import.meta.env.VITE_TOPPING_EXTRA_DELUXE_GRANDE) || 4000
    }
  },
  FINISHING_OPTIONS: [
    { id: 'pesto', name: 'Pesto' },
    { id: 'aceite_oliva', name: 'Aceite de oliva' },
    { id: 'almibar', name: 'Almíbar' },
    { id: 'romero', name: 'Romero' },
    { id: 'sal_gruesa', name: 'Sal gruesa' }
  ],
  TOPPINGS_LIST: [
    new Topping('cebolla', 'Cebolla', 'Común'),
    new Topping('morron', 'Morrón', 'Común'),
    new Topping('papa', 'Papa', 'Común'),
    new Topping('salsa_tomate', 'Salsa de Tomate', 'Común'),
    new Topping('peras', 'Peras', 'Común'),
    new Topping('ajo', 'Ajo', 'Común'),
    new Topping('cherry', 'Tomates Cherry', 'Premium'),
    new Topping('aceitunas', 'Aceitunas Verdes', 'Premium'),
    new Topping('muzzarella', 'Queso Muzzarella', 'Premium'),
    new Topping('tomates_secos', 'Tomates Secos', 'Premium'),
    new Topping('nueces', 'Nueces', 'Premium'),
    new Topping('queso_azul', 'Queso Azul', 'Deluxe'),
    new Topping('hongos', 'Hongos', 'Deluxe')
  ]
};
