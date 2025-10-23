import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TaxConfiguration, ConfigValueType } from '../entities/tax-configuration.entity';

@Injectable()
export class TaxConfigService {
  private readonly logger = new Logger(TaxConfigService.name);
  private readonly CACHE_TTL = 3600;

  constructor(
    @InjectRepository(TaxConfiguration)
    private readonly configRepository: Repository<TaxConfiguration>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async getConfig(taxYear: number, key: string): Promise<any> {
    const cacheKey = `tax_config_${taxYear}_${key}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const config = await this.configRepository.findOne({
      where: {
        taxYear,
        configKey: key,
        isActive: true,
      },
    });

    if (!config) {
      this.logger.warn(`Config not found: ${key} for year ${taxYear}`);
      return null;
    }

    const value = this.parseConfigValue(config.configValue, config.valueType);
    await this.cacheManager.set(cacheKey, value, this.CACHE_TTL);

    return value;
  }

  async getAllConfigs(taxYear: number): Promise<TaxConfiguration[]> {
    return await this.configRepository.find({
      where: {
        taxYear,
        isActive: true,
      },
      order: { configKey: 'ASC' },
    });
  }

  async createConfig(
    taxYear: number,
    key: string,
    value: any,
    valueType: ConfigValueType,
    description?: string,
    effectiveDate?: Date,
    expiryDate?: Date,
  ): Promise<TaxConfiguration> {
    const configValue = this.stringifyConfigValue(value, valueType);

    const config = this.configRepository.create({
      taxYear,
      configKey: key,
      configValue,
      valueType,
      description,
      effectiveDate: effectiveDate || new Date(),
      expiryDate,
      isActive: true,
    });

    const saved = await this.configRepository.save(config);
    await this.invalidateCache(taxYear, key);

    return saved;
  }

  async updateConfig(id: string, value: any): Promise<TaxConfiguration> {
    const config = await this.configRepository.findOne({ where: { id } });

    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    config.configValue = this.stringifyConfigValue(value, config.valueType);
    const updated = await this.configRepository.save(config);

    await this.invalidateCache(config.taxYear, config.configKey);

    return updated;
  }

  async deleteConfig(id: string): Promise<void> {
    const config = await this.configRepository.findOne({ where: { id } });

    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    await this.invalidateCache(config.taxYear, config.configKey);
    await this.configRepository.remove(config);
  }

  async seedDefaultConfigs(taxYear: number): Promise<void> {
    this.logger.log(`Seeding default tax configurations for year ${taxYear}`);

    const defaultConfigs = [
      { key: 'pit.tax_free_threshold', value: 800000, type: ConfigValueType.NUMBER, description: 'Tax-free threshold for PIT' },
      { key: 'pit.rent_relief_cap', value: 500000, type: ConfigValueType.NUMBER, description: 'Maximum rent relief amount' },
      { key: 'pit.rent_relief_rate', value: 0.20, type: ConfigValueType.NUMBER, description: 'Rent relief rate (20%)' },
      { key: 'cit.sme_turnover_threshold', value: 100000000, type: ConfigValueType.NUMBER, description: 'SME turnover threshold (₦100M)' },
      { key: 'cit.sme_asset_threshold', value: 250000000, type: ConfigValueType.NUMBER, description: 'SME asset threshold (₦250M)' },
      { key: 'cit.large_company_threshold', value: 20000000000, type: ConfigValueType.NUMBER, description: 'Large company threshold (₦20B)' },
      { key: 'cit.standard_rate', value: 0.30, type: ConfigValueType.NUMBER, description: 'Standard CIT rate (30%)' },
      { key: 'cit.development_levy_rate', value: 0.04, type: ConfigValueType.NUMBER, description: 'Development levy rate (4%)' },
      { key: 'cgt.exemption_proceeds_threshold', value: 150000000, type: ConfigValueType.NUMBER, description: 'CGT exemption proceeds threshold (₦150M)' },
      { key: 'cgt.exemption_gain_threshold', value: 10000000, type: ConfigValueType.NUMBER, description: 'CGT exemption gain threshold (₦10M)' },
      { key: 'cgt.standard_rate', value: 0.10, type: ConfigValueType.NUMBER, description: 'Standard CGT rate (10%)' },
      { key: 'severance.exemption_cap', value: 50000000, type: ConfigValueType.NUMBER, description: 'Severance exemption cap (₦50M)' },
      { key: 'vat.standard_rate', value: 0.075, type: ConfigValueType.NUMBER, description: 'Standard VAT rate (7.5%)' },
      { key: 'capital_investment.credit_rate', value: 0.05, type: ConfigValueType.NUMBER, description: 'Capital investment credit rate (5%)' },
      { key: 'capital_investment.carryforward_years', value: 5, type: ConfigValueType.NUMBER, description: 'Credit carryforward period (5 years)' },
      { key: 'donation.deduction_rate', value: 0.10, type: ConfigValueType.NUMBER, description: 'Donation deduction rate (10%)' },
      { key: 'agricultural.exemption_years', value: 5, type: ConfigValueType.NUMBER, description: 'Agricultural tax holiday period (5 years)' },
      {
        key: 'pit.tax_slabs',
        value: [
          { min: 0, max: 800000, rate: 0 },
          { min: 800001, max: 3200000, rate: 0.15 },
          { min: 3200001, max: 6400000, rate: 0.18 },
          { min: 6400001, max: 12800000, rate: 0.21 },
          { min: 12800001, max: 25600000, rate: 0.23 },
          { min: 25600001, max: Infinity, rate: 0.25 },
        ],
        type: ConfigValueType.JSON,
        description: 'PIT tax slabs for 2026',
      },
      {
        key: 'presumptive.rates',
        value: {
          street_vendor: 0.01,
          food_vendor: 0.01,
          artisan: 0.015,
          mechanic: 0.015,
          tailor: 0.015,
          hairdresser: 0.015,
          taxi_driver: 0.015,
          small_trader: 0.02,
          other: 0.02,
        },
        type: ConfigValueType.JSON,
        description: 'Presumptive tax rates by activity type',
      },
    ];

    for (const config of defaultConfigs) {
      const existing = await this.configRepository.findOne({
        where: {
          taxYear,
          configKey: config.key,
        },
      });

      if (!existing) {
        await this.createConfig(
          taxYear,
          config.key,
          config.value,
          config.type,
          config.description,
        );
      }
    }

    this.logger.log(`Default configurations seeded for year ${taxYear}`);
  }

  private parseConfigValue(value: string, type: ConfigValueType): any {
    switch (type) {
      case ConfigValueType.NUMBER:
        return parseFloat(value);
      case ConfigValueType.BOOLEAN:
        return value === 'true';
      case ConfigValueType.JSON:
        return JSON.parse(value);
      default:
        return value;
    }
  }

  private stringifyConfigValue(value: any, type: ConfigValueType): string {
    switch (type) {
      case ConfigValueType.JSON:
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }

  private async invalidateCache(taxYear: number, key: string): Promise<void> {
    const cacheKey = `tax_config_${taxYear}_${key}`;
    await this.cacheManager.del(cacheKey);
  }
}

