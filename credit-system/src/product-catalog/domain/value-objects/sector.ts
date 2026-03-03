export type Sector = 'PRIVATE' | 'GOVERNMENT';

export function isSector(value: string): value is Sector {
  return value === 'PRIVATE' || value === 'GOVERNMENT';
}
