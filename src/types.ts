export type ToppingCategory = 'Común' | 'Premium' | 'Deluxe';
export type FocacciaSize = 'Chica' | 'Grande';
export type DeliveryMethod = 'envio' | 'retiro';
export type PaymentMethod = 'efectivo' | 'transferencia';

export interface CustomerDetails {
  name: string;
  deliveryMethod: DeliveryMethod;
  address?: string;
  floor?: string;
  apartment?: string;
  tower?: string;
  deliveryDate?: string;
  paymentMethod: PaymentMethod;
}
