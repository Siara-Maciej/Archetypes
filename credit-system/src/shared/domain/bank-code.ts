export type BankCode = string & { readonly __brand: unique symbol };

export function bankCode(code: string): BankCode {
  if (!code || code.trim().length === 0) {
    throw new Error('BankCode cannot be empty');
  }
  return code.toUpperCase() as BankCode;
}

export const SANTANDER = bankCode('SANTANDER');
export const PKO_BP = bankCode('PKO_BP');
export const MBANK = bankCode('MBANK');
