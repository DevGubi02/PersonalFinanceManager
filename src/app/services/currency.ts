import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CurrencyOption } from '../models/models';

const STORAGE_KEY = 'finance-manager-country';

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly http = inject(HttpClient);
  readonly currencies = signal<CurrencyOption[]>([]);
  readonly selectedCountry = signal(this.readSelectedCountry());
  readonly selectedCurrency = computed(() =>
    this.currencies().find(currency => currency.country === this.selectedCountry())
      ?? this.currencies().find(currency => currency.country === 'India')
      ?? null
  );

  constructor() {
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    if (this.currencies().length > 0) return;
    this.http.get<CurrencyOption[]>('/currencies.json').subscribe({
      next: currencies => this.currencies.set(currencies),
      error: error => console.error('Unable to load currencies', error)
    });
  }

  setCountry(country: string): void {
    if (!this.currencies().some(currency => currency.country === country)) return;
    this.selectedCountry.set(country);
    localStorage.setItem(STORAGE_KEY, country);
  }

  format(value: number | null | undefined): string {
    const amount = Number(value ?? 0);
    const currency = this.selectedCurrency();
    const symbol = currency?.symbol ?? '₹';
    return `${symbol}${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)}`;
  }

  private readSelectedCountry(): string {
    return typeof localStorage === 'undefined' ? 'India' : localStorage.getItem(STORAGE_KEY) ?? 'India';
  }
}
