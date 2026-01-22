import type { TouchlineClient } from '../client';
import type { ConfigParameter } from '../types';

export class ConfigService {
  constructor(private client: TouchlineClient) {}

  async get(category: string, key: string): Promise<{ value: any }> {
    return this.client.sendCommand('configs.get', { category, key });
  }

  async set(category: string, key: string, value: any): Promise<{ success: boolean }> {
    return this.client.sendCommand('configs.set', {
      category,
      key,
      value
    });
  }

  async getCategory(category: string): Promise<{ parameters: ConfigParameter[] }> {
    return this.client.sendCommand('configs.get_category', { category });
  }

  async getAll(): Promise<{ configurations: ConfigParameter[] }> {
    return this.client.sendCommand('configs.get_all', {});
  }

  async createDefaults(): Promise<{ success: boolean }> {
    return this.client.sendCommand('configs.create_defaults', {});
  }

  async getCurrencyConfig(): Promise<{ currency: string; symbol: string }> {
    return this.client.sendCommand('configs.get_currency_config', {});
  }

  async setCurrencySymbol(currency: string): Promise<{ success: boolean }> {
    return this.client.sendCommand('configs.set_currency_symbol', { currency });
  }

  async getCurrencySymbol(): Promise<{ symbol: string }> {
    return this.client.sendCommand('configs.get_currency_symbol', {});
  }

  async getAvailableCurrencies(): Promise<{ currencies: string[] }> {
    return this.client.sendCommand('configs.get_available_currencies', {});
  }
}
