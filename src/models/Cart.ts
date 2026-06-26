import { FocacciaOrder } from './FocacciaOrder';
import type { CustomerDetails, ShippingZone } from '../types';
import { CONFIG } from '../config';

export type ShippingCost = 'gratis' | 'a_convenir' | 'no_disponible';

export class Cart {
  private items: FocacciaOrder[] = [];
  private customerDetails: CustomerDetails | null = null;

  addItem(item: FocacciaOrder) {
    this.items.push(item);
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }

  getItems(): FocacciaOrder[] {
    return [...this.items];
  }

  clearItems() {
    this.items = [];
  }

  getItemCount(): number {
    return this.items.length;
  }

  setCustomerDetails(details: CustomerDetails) {
    this.customerDetails = details;
  }

  getCustomerDetails(): CustomerDetails | null {
    return this.customerDetails;
  }

  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.calculateTotal(), 0);
  }

  detectCategory(): 'Común' | 'Premium' | 'Deluxe' {
    if (this.items.some(item => item.detectCategory() === 'Deluxe')) return 'Deluxe';
    if (this.items.some(item => item.detectCategory() === 'Premium')) return 'Premium';
    return 'Común';
  }

  resolveShippingCost(zone?: ShippingZone): ShippingCost {
    if (!zone) return 'a_convenir';
    if (zone === 'outside_caba') return 'no_disponible';
    if (zone === 'within_3km') return 'gratis';
    if (zone === 'caba') {
      return this.calculateTotal() >= CONFIG.MIN_DELIVERY_AMOUNT ? 'gratis' : 'a_convenir';
    }
    return 'a_convenir';
  }

  isDeliveryFree(zone?: ShippingZone): boolean {
    return this.resolveShippingCost(zone) === 'gratis';
  }

  generateWhatsAppMessage(): string {
    if (!this.customerDetails) return '';

    const details = this.customerDetails;
    const isEnvio = details.deliveryMethod === 'envio';
    const total = this.calculateTotal();

    let msg = `\u{1F35E} *Nuevo Pedido - Natenta*\n\n`;
    msg += `\u{1F464} *Cliente:* ${details.name}\n\n`;

    this.items.forEach((item, index) => {
      msg += `\u{1F6D2} *Pedido #${index + 1}*\n`;
      msg += `\u{1F35E} Focaccia ${item.getSize()} (${item.detectCategory()})\n`;
      msg += `\u{1F33F} Toppings: `;
      const toppings = item.getToppings();
      if (toppings.length === 0) {
        msg += `Solo base`;
      } else {
        msg += toppings.map(t => `${t.name}`).join(', ');
      }
      msg += `\n`;
      const finishingList = item.getFinishing();
      if (finishingList.length > 0) {
        msg += `\u{1F9C2} Terminación: ${finishingList.join(', ')}\n`;
      }
      msg += `\n`;
    });

    msg += `\u{1F4E6} *Modo de Entrega:* ${isEnvio ? 'Envío a domicilio' : 'Retiro por Parque Centenario'}\n`;
    if (isEnvio && details.shippingZone) {
      const shippingCost = this.resolveShippingCost(details.shippingZone);
      if (shippingCost === 'gratis') {
        msg += `✨ *Costo de Envío:* Gratis\n`;
      } else if (shippingCost === 'a_convenir') {
        msg += `💬 *Costo de Envío:* A coordinar con el cliente\n`;
      } else {
        msg += `❌ *Envío:* No disponible — solo retiro en Parque Centenario\n`;
      }
      let addressLine = `\u{1F4CD} *Dirección:* ${details.address}`;
      const extras = [details.floor ? `Piso ${details.floor}` : '', details.apartment ? `Depto ${details.apartment}` : '', details.tower ? `Torre ${details.tower}` : ''].filter(Boolean).join(', ');
      if (extras) addressLine += ` (${extras})`;
      msg += addressLine + `\n`;
      msg += `\u{1F4C5} *Fecha de Envío:* ${details.deliveryDate}\n`;
    } else if (isEnvio) {
      msg += `💬 *Costo de Envío:* A coordinar con el cliente\n`;
      let addressLine = `\u{1F4CD} *Dirección:* ${details.address}`;
      const extras = [details.floor ? `Piso ${details.floor}` : '', details.apartment ? `Depto ${details.apartment}` : '', details.tower ? `Torre ${details.tower}` : ''].filter(Boolean).join(', ');
      if (extras) addressLine += ` (${extras})`;
      msg += addressLine + `\n`;
      msg += `\u{1F4C5} *Fecha de Envío:* ${details.deliveryDate}\n`;
    } else {
      msg += `\u{1F4C5} *Día de Retiro:* ${details.deliveryDate}\n`;
    }

    msg += `\n\u{1F4B3} *Forma de Pago:* ${details.paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia Bancaria'}\n`;
    msg += `\u{1F4B0} *Total del Pedido:* $${total.toLocaleString('es-AR')} ARS\n\n`;
    msg += `¡Muchas gracias! Quedo a la espera de tu confirmación.`;

    return msg;
  }
}
