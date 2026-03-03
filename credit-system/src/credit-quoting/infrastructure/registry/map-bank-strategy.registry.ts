import { Injectable } from '@nestjs/common';
import { BankCode } from '../../../shared/domain';
import {
  BankPipelines,
  BankStrategyRegistry,
} from '../../domain/services/bank-strategy-registry';

@Injectable()
export class MapBankStrategyRegistry implements BankStrategyRegistry {
  constructor(
    private readonly pipelines: Map<string, BankPipelines>,
  ) {}

  resolve(bankCode: BankCode): BankPipelines {
    const key = bankCode as string;
    const result = this.pipelines.get(key);
    if (!result) {
      throw new Error(`No strategy configured for bank: ${key}`);
    }
    return result;
  }

  isSupported(bankCode: BankCode): boolean {
    return this.pipelines.has(bankCode as string);
  }
}
