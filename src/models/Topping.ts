import type { ToppingCategory } from '../types';

export class Topping {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly category: ToppingCategory
  ) {}
}
