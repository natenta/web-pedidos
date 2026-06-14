import { Topping } from './models/Topping';

export const CONFIG = {
  WHATSAPP_NUMBER: import.meta.env.VITE_WHATSAPP_NUMBER || '5491126515156',
  MIN_DELIVERY_AMOUNT: Number(import.meta.env.VITE_MIN_DELIVERY_AMOUNT) || 10000,
  DELIVERY_DAYS: (import.meta.env.VITE_DELIVERY_DAYS || 'Viernes,Sábado').split(','),
  PICKUP_DAYS: (import.meta.env.VITE_PICKUP_DAYS || 'Martes,Jueves').split(','),
  BASE_PRICES: {
    Chica: 5900,
    Grande: 8900
  },
  TOPPING_EXTRA_PRICES: {
    Común: { Chica: 400, Grande: 800 },
    Premium: { Chica: 1000, Grande: 2000 },
    Deluxe: { Chica: 2000, Grande: 4000 }
  },
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
