import { Topping } from './Topping';
import type { FocacciaSize } from '../types';
import { CONFIG } from '../config';

export class FocacciaOrder {
  private toppings: Topping[] = [];
  private size: FocacciaSize = 'Chica';
  private finishing: string[] = [];

  setSize(size: FocacciaSize) {
    this.size = size;
  }

  getSize(): FocacciaSize {
    return this.size;
  }

  toggleFinishing(name: string) {
    const idx = this.finishing.indexOf(name);
    if (idx >= 0) {
      this.finishing.splice(idx, 1);
    } else {
      this.finishing.push(name);
    }
  }

  getFinishing(): string[] {
    return [...this.finishing];
  }

  clearFinishing() {
    this.finishing = [];
  }

  addTopping(topping: Topping) {
    if (!this.toppings.find(t => t.id === topping.id)) {
      this.toppings.push(topping);
    }
  }

  removeTopping(toppingId: string) {
    this.toppings = this.toppings.filter(t => t.id !== toppingId);
  }

  clearToppings() {
    this.toppings = [];
  }

  clearAll() {
    this.toppings = [];
    this.finishing = [];
  }

  getToppings(): Topping[] {
    return [...this.toppings];
  }

  detectCategory(): 'Común' | 'Premium' | 'Deluxe' {
    if (this.toppings.some(t => t.category === 'Deluxe')) return 'Deluxe';
    if (this.toppings.some(t => t.category === 'Premium')) return 'Premium';
    return 'Común';
  }

  calculateTotal(): number {
    const basePrice = CONFIG.BASE_PRICES[this.size];
    let extraPrice = 0;

    const comunes = this.toppings.filter(t => t.category === 'Común');
    if (comunes.length > 2) {
      const extraCount = comunes.length - 2;
      extraPrice += extraCount * CONFIG.TOPPING_EXTRA_PRICES['Común'][this.size];
    }

    const premiumCount = this.toppings.filter(t => t.category === 'Premium').length;
    extraPrice += premiumCount * CONFIG.TOPPING_EXTRA_PRICES['Premium'][this.size];

    const deluxeCount = this.toppings.filter(t => t.category === 'Deluxe').length;
    extraPrice += deluxeCount * CONFIG.TOPPING_EXTRA_PRICES['Deluxe'][this.size];

    return basePrice + extraPrice;
  }
}
